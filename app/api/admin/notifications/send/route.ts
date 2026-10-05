import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { emailQueue, getNotificationProgress } from "@/lib/queue";
import { subDays } from "date-fns";
import { logger } from "@/lib/logger";

/**
 * How long this request is willing to stay open watching a campaign drain.
 *
 * The old implementation blocked for up to 120s polling per-job state. On a
 * serverless runtime that overruns the invocation budget, and a single recipient
 * hitting an SMTP connection timeout threw its way out to a 500 while hundreds of
 * emails had in fact been delivered.
 *
 * We now watch only long enough for a *small* campaign to report real counts, then
 * hand the campaign back to the queue — its authoritative status is written by the
 * worker (see lib/queue.ts) and shown in the History tab. This is deliberately
 * short: at the configured rate limit a large campaign cannot finish inside any
 * sane request budget, so blocking longer only delays the admin for no new
 * information.
 */
const OBSERVE_BUDGET_MS = Number(process.env.NOTIFICATION_OBSERVE_BUDGET_MS) || 4_000;
const POLL_INTERVAL_MS = 300;

/** Spreads enqueue so a burst doesn't open N SMTP connections at the same instant. */
const ENQUEUE_STAGGER_MAX_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await getAdminInfo();
    const { subject, body, recipientFilter } = await req.json();

    await logger.info(`Starting mass notification send: ${subject}`, { recipientFilter }, "API");

    if (!subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch unsubscribed emails
    const unsubscribed = await (prisma as any).unsubscribe.findMany({
      select: { email: true }
    });
    const unsubscribedEmails = unsubscribed.map((u: any) => u.email);

    // 2. Build where clause
    const where: any = {
      email: { notIn: unsubscribedEmails }
    };

    if (recipientFilter) {
      const { 
        twoFactorEnabled, limitMode, active30d, newUsers, 
        incomeNoExpenses, noIncomeNoExpenses,
        inactive2d, inactive7d, specificEmail 
      } = recipientFilter;

      if (twoFactorEnabled) where.twoFactorEnabled = true;
      if (limitMode) where.expenseMode = "limit";
      if (active30d) where.lastActive = { gte: subDays(new Date(), 30) };
      if (newUsers) where.createdAt = { gte: subDays(new Date(), 7) };
      
      if (incomeNoExpenses) {
        where.incomes = { some: {} };
        where.expenses = { none: {} };
      }
      
      if (noIncomeNoExpenses) {
        where.incomes = { none: {} };
        where.expenses = { none: {} };
      }

      if (inactive2d) {
        where.lastActive = { lte: subDays(new Date(), 2) };
      }

      if (inactive7d) {
        where.lastActive = { lte: subDays(new Date(), 7) };
      }

      if (recipientFilter.onboarded === false) {
        where.onboarded = false;
      }

      if (recipientFilter.noPWA === true) {
        where.isPWAInstalled = false;
      }

      if (specificEmail) where.email = specificEmail;
    }

    // 3. Fetch recipients
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // 4. Resolve the recipients that can actually be delivered to. `recipientCount`
    // below is this list's length, not `users.length` — the worker finalises the
    // campaign once it has seen that many settled jobs, so a mismatch would leave
    // the row stuck in PROCESSING forever.
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

    // 5. Create notification record
    const notification = await (prisma as any).notification.create({
      data: {
        subject,
        body,
        recipientCount,
        recipientFilter: JSON.stringify(recipientFilter || {}),
        status: "PROCESSING",
        adminName: admin?.adminName || "SpendWise",
      }
    });

    // 6. Enqueue one job per recipient. `addBulk` is a single Redis round trip;
    // a sequential `await queue.add()` per recipient cost ~60ms each, which meant
    // an 8s enqueue phase *before* any mail went out (the send endpoint measured
    // 24s wall-clock for 131 recipients). The stagger keeps the first wave of SMTP
    // handshakes from landing on the provider all at once — a simultaneous burst
    // is what trips Gmail's connection throttling.
    const jobOptions = emailQueue.opts.defaultJobOptions ?? {};
    await emailQueue.addBulk(
      eligibleRecipients.map((user, index) => ({
        name: "send-email",
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || "User",
          subject,
          body,
          notificationId: notification.id,
          recipientCount,
        },
        opts: {
          ...jobOptions,
          delay: Math.floor(Math.random() * ENQUEUE_STAGGER_MAX_MS) + index * 2,
        },
      }))
    );

    await logger.info(`Enqueued ${recipientCount} email jobs`, {
      notificationId: notification.id,
    }, "API");

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "MASS_NOTIFICATION_ENQUEUE",
      target: notification.id,
      details: `subject="${subject}" recipients=${recipientCount} filter=${JSON.stringify(
        recipientFilter || {}
      )}`,
      ip,
    });

    // 7. Observe briefly. A campaign is "done" when every recipient job has
    // settled; anything still in flight is reported as processing, not failed.
    const deadline = Date.now() + OBSERVE_BUDGET_MS;
    let progress = await getNotificationProgress(notification.id);

    while (Date.now() < deadline) {
      if (progress && progress.settled >= recipientCount) break;
      await sleep(POLL_INTERVAL_MS);
      progress = await getNotificationProgress(notification.id).catch(() => progress);
    }

    const delivered = progress?.delivered ?? 0;
    const failed = progress?.failed ?? 0;
    const settled = progress?.settled ?? 0;
    const inFlight = Math.max(0, recipientCount - settled);
    const finished = inFlight === 0;

    if (inFlight > 0) {
      await logger.info(
        `Campaign still delivering after ${OBSERVE_BUDGET_MS}ms — handing off to the queue`,
        { notificationId: notification.id, delivered, failed, inFlight },
        "API"
      );
    }

    // Partial delivery is an outcome to report, not an API failure — the admin
    // needs the history row and the counts, not a 500.
    if (finished && failed > 0) {
      await logger.warn(
        `Campaign finished with ${failed} failed recipient(s)`,
        { notificationId: notification.id, delivered, failed },
        "API"
      );
    }

    return NextResponse.json({
      success: true,
      status: inFlight > 0 ? "PROCESSING" : failed > 0 ? "PARTIAL" : "SUCCESS",
      message:
        inFlight > 0
          ? `Queued for ${recipientCount} recipient(s). ${delivered} delivered so far — track progress in History.`
          : failed > 0
            ? `Delivered to ${delivered} of ${recipientCount} recipient(s). See History for failures.`
            : `Delivered to all ${recipientCount} recipient(s).`,
      notificationId: notification.id,
      count: recipientCount,
      delivered,
      failed,
      inFlight,
    });
  } catch (error: any) {
    await logger.error("Notification Send-API Error", { error: error.message });
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
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

    const notification = await (prisma as any).notification.findUnique({
      where: { id },
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    logger.error("Notification GET-API Error", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}