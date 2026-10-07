import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { sendEmail, replaceVariables, wrapLayout } from "./mail";
import { prisma } from "./prisma";
import IORedis from "ioredis";
import { logger } from "./logger";

/**
 * REDIS CONFIGURATION
 */
const REDIS_CONFIG = {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
};

const getRedisUrl = () => process.env.REDIS_URI || "redis://127.0.0.1:6379";

/**
 * SINGLETON CONNECTIONS
 */
const globalForRedis = global as unknown as {
  redisQueue: IORedis;
  redisWorker: IORedis;
  redisEvents: IORedis;
};

const getQueueConn = () => {
  if (!globalForRedis.redisQueue) globalForRedis.redisQueue = new IORedis(getRedisUrl(), REDIS_CONFIG);
  return globalForRedis.redisQueue;
};

const getWorkerConn = () => {
  if (!globalForRedis.redisWorker) globalForRedis.redisWorker = new IORedis(getRedisUrl(), REDIS_CONFIG);
  return globalForRedis.redisWorker;
};

const getEventsConn = () => {
  if (!globalForRedis.redisEvents) globalForRedis.redisEvents = new IORedis(getRedisUrl(), REDIS_CONFIG);
  return globalForRedis.redisEvents;
};

/**
 * SINGLETON BULLMQ INSTANCES
 */
const globalForBull = global as unknown as {
  emailQueue: Queue;
  emailWorker: Worker;
  emailEvents: QueueEvents;
};

// Queue Setup
//
// Retries exist to ride out transient SMTP failures ("Connection timeout" when a
// provider throttles a burst). The original 3 attempts / 1s base gave a throttled
// connection no room to recover, so a job exhausted its retries inside a couple of
// seconds and the campaign was reported as failed.
const DEFAULT_ATTEMPTS = 5;
const DEFAULT_BACKOFF_MS = 5000;

export const emailQueue = globalForBull.emailQueue || new Queue("emailQueue", { 
  connection: getQueueConn(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: Number(process.env.EMAIL_QUEUE_ATTEMPTS) || DEFAULT_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: Number(process.env.EMAIL_QUEUE_BACKOFF_MS) || DEFAULT_BACKOFF_MS,
    },
  }
});

if (process.env.NODE_ENV !== "production") globalForBull.emailQueue = emailQueue;

// Events Setup
if (!globalForBull.emailEvents) {
  globalForBull.emailEvents = new QueueEvents("emailQueue", { connection: getEventsConn() });
  
  globalForBull.emailEvents.on('waiting', ({ jobId }) => logger.info(`[Queue] Job ${jobId} is waiting`, null, "QUEUE"));
  globalForBull.emailEvents.on('active', ({ jobId }) => logger.info(`[Queue] Job ${jobId} is active`, null, "QUEUE"));
  globalForBull.emailEvents.on('completed', ({ jobId }) => logger.info(`[Queue] Job ${jobId} completed`, null, "QUEUE"));
  globalForBull.emailEvents.on('failed', ({ jobId, failedReason }) => logger.error(`[Queue] Job ${jobId} failed: ${failedReason}`, null, "QUEUE"));
}

export const emailEvents = globalForBull.emailEvents;

/**
 * CAMPAIGN STATUS
 *
 * A mass notification is one `Notification` row plus one job per recipient. That
 * row used to be stamped to "SUCCESS" by whichever job succeeded first, so an
 * 847-recipient campaign showed "Success" after email number one — and a campaign
 * that timed out mid-flight was left claiming success too.
 *
 * Instead each settled job records its outcome against a short-lived Redis
 * counter, and the campaign is finalised exactly once, by the job that brings the
 * tally to `recipientCount`. If the invocation dies before every job settles, the
 * row stays "PROCESSING" and is finalised by whichever invocation drains the rest
 * of the queue — which is the honest state, and recoverable.
 */
const PROGRESS_TTL_SECONDS = 60 * 60 * 24;

const progressKey = (notificationId: string) => `sw:notification:${notificationId}:progress`;

async function recordJobOutcome(
  notificationId: string,
  recipientCount: number,
  delivered: boolean
): Promise<void> {
  try {
    const redis = getQueueConn();
    const key = progressKey(notificationId);
    const field = delivered ? "delivered" : "failed";

    await redis.hincrby(key, field, 1);
    await redis.expire(key, PROGRESS_TTL_SECONDS);

    const [deliveredRaw, failedRaw] = (await redis.hmget(key, "delivered", "failed")) as [
      string | null,
      string | null,
    ];

    const deliveredCount = Number(deliveredRaw ?? 0);
    const failedCount = Number(failedRaw ?? 0);
    const settled = deliveredCount + failedCount;

    if (!recipientCount || settled < recipientCount) return;

    const status =
      failedCount === 0 ? "SUCCESS" : deliveredCount > 0 ? "PARTIAL" : "FAILED";

    await (prisma as any).notification.update({
      where: { id: notificationId },
      data: {
        status,
        error:
          failedCount > 0
            ? `${failedCount} of ${settled} recipients failed to send`
            : null,
      },
    });

    // The hash is left in place (TTL-bound) rather than deleted, so a caller can
    // still read the final tally — see getNotificationProgress().

    logger.info(
      `[Queue] Notification ${notificationId} finalised: ${status} (${deliveredCount} delivered, ${failedCount} failed)`,
      null,
      "QUEUE"
    );
  } catch (error: any) {
    // Never fail a send because its bookkeeping failed.
    logger.error(
      `[Queue] Failed to record outcome for notification ${notificationId}`,
      { error: error?.message },
      "QUEUE"
    );
  }
}

export interface NotificationProgress {
  delivered: number;
  failed: number;
  settled: number;
}

/**
 * Reads how many recipient jobs for a campaign have settled so far.
 * `null` means none have — the key only exists once the first job records.
 */
export async function getNotificationProgress(
  notificationId: string
): Promise<NotificationProgress | null> {
  const redis = getQueueConn();
  const [deliveredRaw, failedRaw] = (await redis.hmget(
    progressKey(notificationId),
    "delivered",
    "failed"
  )) as [string | null, string | null];

  if (deliveredRaw === null && failedRaw === null) return null;

  const delivered = Number(deliveredRaw ?? 0);
  const failed = Number(failedRaw ?? 0);
  return { delivered, failed, settled: delivered + failed };
}

/**
 * WORKER PROCESSOR
 */
async function jobProcessor(job: Job) {
  logger.info(`[Worker] Job ${job.id} picked up for processing`, null, "QUEUE");
  const { userEmail, userName, subject, body, notificationId, recipientCount, ...extra } = job.data;
  logger.info(`[Worker] Processing ${job.id} for ${userEmail}`, null, "QUEUE");

  // BullMQ increments attemptsMade per run, so the last attempt is the one that
  // counts towards the campaign tally.
  const isFinalAttempt = () => job.attemptsMade >= (job.opts?.attempts ?? 1);

  try {
    const variables = { 
      userName: userName || "User", 
      date: extra.date || new Date().toLocaleDateString(), 
      ...extra 
    };

    const personalizedSubject = replaceVariables(subject, variables);
    const contentHtml = replaceVariables(body, variables).replace(/\n/g, '<br/>');
    let html = wrapLayout(contentHtml, userEmail);

    // Open/click tracking: one EmailLog row per campaign+recipient (createEmailLog
    // reuses the row on retries so a re-attempted job can't double-count opens).
    // A tracking failure degrades to a plain send — it never blocks delivery.
    if (notificationId) {
      const { createEmailLog, injectEmailTracking } = await import("./email-tracking");
      const logId = await createEmailLog({
        campaignId: notificationId,
        userId: typeof extra.userId === "string" ? extra.userId : null,
        email: userEmail,
      });
      html = injectEmailTracking(html, logId);
    }

    const result = await sendEmail(userEmail, personalizedSubject, html);

    if (!result.success) throw new Error(`SMTP Error: ${result.error}`);

    if (notificationId) {
      await recordJobOutcome(notificationId, Number(recipientCount) || 0, true);
    }

    logger.info(`[Worker] Job ${job.id} finished`, null, "QUEUE");
    return result;
  } catch (error) {
    logger.warn(
      `[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts?.attempts ?? 1}): ${(error as Error)?.message}`,
      null,
      "QUEUE"
    );
    if (notificationId && isFinalAttempt()) {
      await recordJobOutcome(notificationId, Number(recipientCount) || 0, false);
    }
    throw error;
  }
}

// Worker Setup
//
// `lockDuration` must comfortably exceed the worst case of one job. A send is
// bounded by the SMTP timeouts in lib/mail.ts (connect 10s + greeting 10s +
// socket 60s), so 120s leaves headroom. Leaving this at BullMQ's 30s default was
// actively harmful: the connection and greeting timeouts were *also* 30s, so the
// lock expired at the exact moment a hung connection gave up. BullMQ then
// re-queued the job as "stalled" rather than retrying it, the exponential backoff
// never engaged, and one unreachable host burned five full stalls (~3 minutes)
// before the job was finally declared failed.
const WORKER_LOCK_DURATION_MS = 120_000;
const WORKER_MAX_STALLED_COUNT = 2;

/**
 * 1 by default — one send at a time.
 *
 * The provider throttles concurrent SMTP sessions from one account by *stalling*
 * them rather than rejecting them, so parallelism here does not increase
 * throughput; it just converts sends into timeouts. Measured with the real
 * credentials: concurrency 5 gave p50 6.6s / p90 16.4s per send, concurrency 1
 * gave p50 1.8s / p90 4.3s. Raise it only with evidence that the provider tolerates it.
 */
const WORKER_CONCURRENCY = Number(process.env.EMAIL_WORKER_CONCURRENCY) || 1;

if (!globalForBull.emailWorker) {
  globalForBull.emailWorker = new Worker("emailQueue", jobProcessor, { 
    connection: getWorkerConn(),
    concurrency: WORKER_CONCURRENCY,
    lockDuration: WORKER_LOCK_DURATION_MS,
    maxStalledCount: WORKER_MAX_STALLED_COUNT,
  });

  logger.info(
    `[Worker] emailQueue worker started (concurrency=${WORKER_CONCURRENCY}, lockDuration=${WORKER_LOCK_DURATION_MS}ms)`,
    null,
    "QUEUE"
  );

  globalForBull.emailWorker.on("failed", (job, err) => {
    if (!job) return;
    const attempts = job.opts?.attempts ?? 1;
    const message = `[Worker] Job ${job.id} failed after ${job.attemptsMade}/${attempts} attempt(s): ${err.message}`;
    // Warn until the job is genuinely out of retries. ERROR-level logs also page
    // the admin by email, and one recipient timing out is not a system fault.
    if (job.attemptsMade >= attempts) {
      logger.error(message, null, "QUEUE");
    } else {
      logger.warn(message, null, "QUEUE");
    }
  });

  // A stall means the lock expired mid-send — almost always a hanging SMTP
  // socket. Logged explicitly so the cause is visible rather than looking like an
  // inexplicable requeue.
  globalForBull.emailWorker.on("stalled", (jobId) =>
    logger.warn(
      `[Worker] Job ${jobId} stalled (lock held longer than ${WORKER_LOCK_DURATION_MS}ms) and was requeued`,
      null,
      "QUEUE"
    )
  );

  globalForBull.emailWorker.on("error", (err) =>
    logger.error(`[Worker] Worker error: ${err.message}`, null, "QUEUE")
  );
}

export const emailWorker = globalForBull.emailWorker;