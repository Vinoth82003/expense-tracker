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
  type RecipientFilter,
} from "@/lib/admin/notification-recipients";
import {
  describeNotificationStatus,
  nextAttemptCount,
  sanitizeEmailErrorCode,
  sanitizeEmailErrorSummary,
} from "@/lib/email-jobs";

/**
 * Retry a failed / partial campaign.
 *
 * Spec 14: a retry is the SAME logical message. It re-uses the existing
 * Notification row (so History shows one entry with an inspectable attempt
 * count), re-uses the existing EmailLog rows (so open counts cannot double), and
 * only increments `attempts`.
 */
const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const SEND_STAGGER_MS = Number(process.env.NOTIFICATION_SEND_STAGGER_MS) || 250;
const RETRYABLE = new Set(["FAILED", "PARTIAL", "RETRY_SCHEDULED"]);

export const maxDuration = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const admin = await getAdminInfo();
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const status = (notification.status || "").toUpperCase();
    if (status === "PROCESSING") {
      return NextResponse.json(
        { error: "This campaign is still in progress and cannot be retried yet." },
        { status: 409 }
      );
    }
    if (!RETRYABLE.has(status)) {
      return NextResponse.json(
        {
          error: `Only failed or partial campaigns can be retried (current state: ${describeNotificationStatus(status).label}).`,
        },
        { status: 409 }
      );
    }

    const correlationId = notification.correlationId ?? notification.id;

    // Resolve the same audience the original send used, excluding unsubscribes.
    const parsedFilter: RecipientFilter | null = notification.recipientFilter
      ? (JSON.parse(notification.recipientFilter) as RecipientFilter)
      : null;
    const unsubscribedEmails = await getUnsubscribedEmails();
    const where = buildRecipientWhere(parsedFilter, unsubscribedEmails);
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
    });
    const eligibleRecipients = users.filter((u) => Boolean(u.id && u.email));

    if (eligibleRecipients.length === 0) {
      return NextResponse.json(
        { error: "No eligible recipients to retry." },
        { status: 400 }
      );
    }

    const attempts = nextAttemptCount(notification.attempts);
    const format = notification.bodyFormat === "html" ? "html" : "text";
    const recipientCount = eligibleRecipients.length;

    await logger.info(
      "Email job retry started",
      { correlationId, notificationId: notification.id, attempt: attempts },
      "API"
    );

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "PROCESSING",
        processingAt: new Date(),
        attempts,
        deliveryConfirmed: false,
      },
    });

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
        const personalizedSubject = replaceVariables(notification.subject, variables);
        const personalizedBody = replaceVariables(notification.body, variables);
        const contentHtml =
          format === "html" ? personalizedBody : personalizedBody.replace(/\n/g, "<br/>");
        let html = wrapLayout(contentHtml, user.email);

        // Reuses the existing row for campaign+recipient, so opens never double.
        const logId = await createEmailLog({
          campaignId: notification.id,
          userId: user.id,
          email: user.email,
        });
        html = injectEmailTracking(html, logId);

        const result = await sendEmail(user.email, personalizedSubject, html);
        if (result.success) {
          delivered++;
        } else {
          failed++;
          errors.push(`${user.email}: ${result.error}`);
        }
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${user.email}: ${message}`);
      }

      if (i < eligibleRecipients.length - 1 && SEND_STAGGER_MS > 0) {
        await sleep(SEND_STAGGER_MS);
      }
    }

    const finalStatus =
      failed === 0 ? "SUCCESS" : delivered > 0 ? "PARTIAL" : "FAILED";
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
        status: finalStatus,
        deliveredCount: delivered,
        failedCount: failed,
        completedAt: new Date(),
        deliveryConfirmed: false,
        errorCode,
        ...(errorSummary ? { error: errorSummary } : {}),
      },
    });

    const lifecycle = describeNotificationStatus(finalStatus, {
      deliveryConfirmed: false,
      attempts,
    });
    await logger.info(
      `Email job retry completed: ${lifecycle.label} attempt=${attempts} (${delivered}/${recipientCount})`,
      { correlationId, notificationId: notification.id, status: finalStatus, delivered, failed },
      "API"
    );

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "MASS_NOTIFICATION_RETRY",
      target: notification.id,
      details: `attempt=${attempts} recipients=${recipientCount} delivered=${delivered} failed=${failed}`,
      ip,
    });

    if (delivered === 0 && failed > 0) {
      return NextResponse.json(
        { error: `Retry failed for all ${failed} recipient(s). ${errors[0] ?? ""}`.trim() },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      lifecycle: lifecycle.key,
      lifecycleLabel: lifecycle.label,
      notificationId: notification.id,
      correlationId,
      attempts,
      count: recipientCount,
      delivered,
      failed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logger.error("Notification retry-API Error", { error: message });
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
