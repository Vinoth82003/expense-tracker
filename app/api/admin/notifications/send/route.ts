import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";
import { sendEmail, replaceVariables, wrapLayout } from "@/lib/mail";
import { createEmailLog, injectEmailTracking } from "@/lib/email-tracking";
import {
  buildRecipientWhere,
  getUnsubscribedEmails,
} from "@/lib/admin/notification-recipients";
import {
  DEFAULT_MESSAGE_TYPE,
  describeNotificationStatus,
  sanitizeEmailErrorCode,
  sanitizeEmailErrorSummary,
} from "@/lib/email-jobs";
import { randomUUID } from "crypto";

/**
 * Mass notification delivery.
 *
 * This flow used to enqueue one BullMQ job per recipient and let a background
 * worker drain the queue. That architecture only works with a long-running Node
 * process (a Render Web Service/Background Worker). On a serverless runtime the
 * worker starts, the invocation returns, and the process freezes — jobs sit in
 * Redis forever and the campaign is stuck in PROCESSING. That is why this path
 * failed while /admin/reviews (which sends inline) worked.
 *
 * Delivery is now inline and sequential, mirroring /api/admin/reviews:
 *   - one EmailLog row per recipient (campaignId = Notification.id) for
 *     open/click tracking and the admin opened-user list
 *   - the Notification row is finalised synchronously (SUCCESS/PARTIAL/FAILED)
 *   - no Redis / BullMQ dependency, so it behaves identically on Vercel, Render,
 *     or locally
 *
 * Sequential (not parallel) is deliberate: Gmail throttles concurrent SMTP
 * sessions from one account by stalling them, which turns a burst into
 * timeouts. The stagger keeps the handshakes from landing at the same instant.
 */
const SEND_STAGGER_MS = Number(process.env.NOTIFICATION_SEND_STAGGER_MS) || 250;

// Give the function room to finish a campaign on hosts that cap the invocation
// (Vercel honours this; other platforms ignore it).
export const maxDuration = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** "html" is a raw embed; anything else is treated as plain text. */
const normalizeFormat = (value: unknown): "text" | "html" =>
  value === "html" ? "html" : "text";

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 100_000;

/** Message-type allowlist so a caller cannot persist arbitrary values. */
const MESSAGE_TYPES = new Set([
  "ANNOUNCEMENT",
  "TEST",
  "FEEDBACK_REQUEST",
  "SYSTEM",
]);

const normalizeMessageType = (value: unknown): string =>
  typeof value === "string" && MESSAGE_TYPES.has(value)
    ? value
    : DEFAULT_MESSAGE_TYPE;

/** Only a plain object is a valid recipient filter; arrays/null are rejected. */
const normalizeRecipientFilter = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

/** Renders an admin-authored body into the branded, sendable HTML. */
function renderBody(
  rawBody: string,
  format: "text" | "html",
  variables: Record<string, string>
): string {
  const personalized = replaceVariables(rawBody, variables);
  const contentHtml =
    format === "html" ? personalized : personalized.replace(/\n/g, "<br/>");
  return contentHtml;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await getAdminInfo();
    const payload = await req.json().catch(() => ({}));
    const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
    const body = typeof payload?.body === "string" ? payload.body : "";
    const format = normalizeFormat(payload?.bodyFormat);
    const messageType = normalizeMessageType(payload?.messageType);
    const templateId =
      typeof payload?.templateId === "string" && payload.templateId
        ? payload.templateId
        : null;
    const templateVersion =
      typeof payload?.templateVersion === "string" && payload.templateVersion
        ? payload.templateVersion
        : null;
    const recipientFilter = normalizeRecipientFilter(payload?.recipientFilter);

    if (!subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        { error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }
    if (body.length > MAX_BODY_LENGTH) {
      return NextResponse.json(
        { error: `Body must be ${MAX_BODY_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    // Stable id shared with the SystemLog rows for this job (spec 14).
    const correlationId = randomUUID();

    await logger.info(
      "Email job accepted for processing",
      { correlationId, messageType, recipientFilter },
      "API"
    );

    // 1. Fetch unsubscribed emails so they are excluded from the audience.
    const unsubscribedEmails = await getUnsubscribedEmails();

    // 2. Build where clause (shared with the audience-preview endpoint).
    const where = buildRecipientWhere(recipientFilter, unsubscribedEmails);

    // 3. Fetch recipients
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // 4. Resolve the recipients that can actually be delivered to.
    const eligibleRecipients = users.filter((user) => Boolean(user.id && user.email));

    for (const skipped of users.filter((user) => !user.id || !user.email)) {
      await logger.warn("Skipping recipient with incomplete user record", {
        userId: skipped.id ?? null,
      }, "API");
    }

    if (eligibleRecipients.length === 0) {
      return NextResponse.json(
        { error: "No eligible recipients — matched users have no email on file" },
        { status: 400 }
      );
    }

    const recipientCount = eligibleRecipients.length;

    // 5. Create the campaign record up front so EmailLog rows can reference it.
    //    One logical message: a retry increments `attempts`, it never inserts a
    //    second Notification row.
    const startedAt = new Date();
    const notification = await prisma.notification.create({
      data: {
        subject,
        body,
        bodyFormat: format,
        recipientCount,
        recipientFilter: JSON.stringify(recipientFilter),
        status: "PROCESSING",
        adminName: admin?.adminName || "SpendWise",
        correlationId,
        messageType,
        templateId,
        templateVersion,
        attempts: 1,
        deliveredCount: 0,
        failedCount: 0,
        queuedAt: startedAt,
        processingAt: startedAt,
        deliveryConfirmed: false,
      },
    });

    // 6. Send sequentially.
    let delivered = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligibleRecipients.length; i++) {
      const user = eligibleRecipients[i];
      try {
        const variables: Record<string, string> = {
          userName: user.name || "User",
          date: new Date().toLocaleDateString(),
        };

        const personalizedSubject = replaceVariables(subject, variables);
        let html = wrapLayout(renderBody(body, format, variables), user.email);

        // One tracking row per recipient (createEmailLog reuses the row on retry),
        // so opens/clicks land on this campaign's row. Non-throwing by contract.
        const logId = await createEmailLog({
          campaignId: notification.id,
          userId: user.id,
          email: user.email,
        });
        html = injectEmailTracking(html, logId);

        const result = await sendEmail(user.email, personalizedSubject, html);

        if (result.success) {
          delivered++;
          await logger.info(`Notification sent to ${user.email}`, null, "API");
        } else {
          failed++;
          errors.push(`${user.email}: ${result.error}`);
          await logger.error(`Failed to send notification to ${user.email}`, { error: result.error }, "API");
        }
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${user.email}: ${message}`);
        await logger.error(`Exception sending notification to ${user.email}`, { error: message }, "API");
      }

      if (i < eligibleRecipients.length - 1 && SEND_STAGGER_MS > 0) {
        await sleep(SEND_STAGGER_MS);
      }
    }

    // 7. Finalise the campaign status synchronously. SUCCESS means the provider
    //    ACCEPTED every message — it is not a delivery confirmation, so
    //    deliveryConfirmed stays false.
    const status = failed === 0 ? "SUCCESS" : delivered > 0 ? "PARTIAL" : "FAILED";
    const errorCode = failed > 0 ? sanitizeEmailErrorCode(errors[0]) : null;
    const errorSummary =
      failed > 0
        ? sanitizeEmailErrorSummary(
            `${failed} of ${recipientCount} recipients failed: ${errors[0] ?? ""}`
          )
        : null;

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status,
        deliveredCount: delivered,
        failedCount: failed,
        completedAt: new Date(),
        deliveryConfirmed: false,
        errorCode,
        ...(errorSummary ? { error: errorSummary } : {}),
      },
    }).catch(() => {});

    const lifecycle = describeNotificationStatus(status, {
      deliveryConfirmed: false,
      attempts: 1,
    });
    const terminalLog = {
      correlationId,
      notificationId: notification.id,
      status,
      lifecycle: lifecycle.key,
      delivered,
      failed,
    };
    if (failed === 0) {
      await logger.info(
        `Email job completed: ${lifecycle.label} (${delivered}/${recipientCount})`,
        terminalLog,
        "API"
      );
    } else {
      await logger.warn(
        `Email job completed: ${lifecycle.label} (${delivered}/${recipientCount}, ${failed} failed, code=${errorCode ?? "n/a"})`,
        terminalLog,
        "API"
      );
    }

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "MASS_NOTIFICATION_SEND",
      target: notification.id,
      details: `subject="${subject}" recipients=${recipientCount} delivered=${delivered} failed=${failed} format=${format} filter=${JSON.stringify(
        recipientFilter || {}
      )}`,
      ip,
    });

    if (failed > 0) {
      await logger.warn(
        `Campaign finished with ${failed} failed recipient(s)`,
        { notificationId: notification.id, delivered, failed },
        "API"
      );
    }

    // A total failure is reported as an API error so the admin sees the reason
    // rather than a success toast. Partial delivery is a reported outcome.
    if (delivered === 0 && failed > 0) {
      return NextResponse.json(
        { error: `All ${failed} email(s) failed. ${errors[0] ?? ""}`.trim() },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
      lifecycle: lifecycle.key,
      lifecycleLabel: lifecycle.label,
      deliveryConfirmed: false,
      message:
        failed > 0
          ? `Accepted by the provider for ${delivered} of ${recipientCount} recipient(s); ${failed} failed. See History for details.`
          : `Accepted by the provider for all ${recipientCount} recipient(s). Delivery not independently confirmed.`,
      notificationId: notification.id,
      correlationId,
      attempts: 1,
      count: recipientCount,
      delivered,
      failed,
      inFlight: 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logger.error("Notification Send-API Error", { error: message });
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    return NextResponse.json(notification);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Notification GET-API Error", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
