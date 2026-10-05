/**
 * End-to-end verification of the real send path — real Redis, real BullMQ queue,
 * real `lib/mail.ts` pooled transporter, one real message per recipient.
 *
 * This is the path that actually failed in production (job 131 stalling with
 * "SMTP Error: Connection timeout"), so a probe that bypasses the queue is not
 * sufficient evidence. It reproduces the production shape: a worker consuming a
 * queue, N recipient jobs, a warm pooled transporter, and BullMQ's lock/stall
 * semantics in play.
 *
 * It SENDS REAL EMAILS, so it is opt-in and excluded from the normal run:
 *
 *   RUN_SMTP_VERIFY=1 npx vitest run tests/queue-send.verify.ts
 *
 * Recipients default to SMTP_USER (a self-send). Override with
 * SMTP_VERIFY_RECIPIENTS / SMTP_VERIFY_COUNT.
 */
import { describe, it, expect } from "vitest";
import { Queue, QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";
import { sendEmail } from "../lib/mail";

const ENABLED = process.env.RUN_SMTP_VERIFY === "1";
const REDIS_URL = process.env.REDIS_URI || "redis://127.0.0.1:6379";
const COUNT = Number(process.env.SMTP_VERIFY_COUNT) || 5;

// Generous: a serialised send is ~1.8s, and we wait out retries deliberately.
const TIMEOUT_MS = 180_000;

const connection = () =>
  new IORedis(REDIS_URL, { maxRetriesPerRequest: null, enableOfflineQueue: true });

const recipients = () => {
  const explicit = process.env.SMTP_VERIFY_RECIPIENTS;
  if (explicit) return explicit.split(",").map((s) => s.trim()).filter(Boolean);
  const user = process.env.SMTP_USER;
  return Array.from({ length: COUNT }, () => user);
};

describe.skipIf(!ENABLED)("mass send through the real queue", () => {
  it(
    "delivers every recipient job without stalling",
    async () => {
      const queueName = `smtp-verify-${Date.now()}`;
      const queue = new Queue(queueName, { connection: connection() });
      const targets = recipients();
      expect(targets.length).toBeGreaterThan(0);

      const timings: Array<{ id: string; ms: number; ok: boolean; error?: string }> = [];

      const worker = new Worker(
        queueName,
        async (job) => {
          const started = Date.now();
          const result = await sendEmail(
            job.data.userEmail,
            `Queue send verification (${queueName})`,
            "<p>End-to-end queue verification.</p>"
          );
          timings.push({
            id: String(job.id),
            ms: Date.now() - started,
            ok: result.success,
            error: result.success ? undefined : result.error,
          });
          if (!result.success) throw new Error(result.error);
          return result;
        },
        {
          connection: connection(),
          // Mirrors lib/queue.ts defaults.
          concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY) || 1,
          lockDuration: 120_000,
          maxStalledCount: 2,
        }
      );

      const stalled: string[] = [];
      worker.on("stalled", (id) => stalled.push(String(id)));
      worker.on("failed", (job, err) => {
        console.error(`  job ${job?.id} failed: ${err.message}`);
      });

      const jobs = await Promise.all(
        targets.map((userEmail) =>
          queue.add(
            "send-email",
            { userEmail },
            { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
          )
        )
      );

      const wallStart = Date.now();
      // `Job` is not an EventEmitter — `waitUntilFinished` over QueueEvents is the
      // supported way to await one job's terminal state.
      const queueEvents = new QueueEvents(queueName, { connection: connection() });
      const outcomes = await Promise.all(
        jobs.map((job) =>
          job
            .waitUntilFinished(queueEvents)
            .then(() => "completed")
            .catch(() => "failed")
        )
      );
      const wall = Date.now() - wallStart;

      const completed = outcomes.filter((o) => o === "completed").length;
      const times = timings.map((t) => t.ms).sort((a, b) => a - b);
      console.log(
        `\n  wall=${wall}ms completed=${completed}/${outcomes.length} ` +
          `stalled=${stalled.length} recordedSends=${timings.length}` +
          (times.length
            ? ` perSendMin=${times[0]} p50=${times[Math.floor(times.length / 2)]} max=${times[times.length - 1]}`
            : "")
      );
      for (const t of timings.filter((x) => !x.ok)) {
        console.error(`  send failed: ${t.error}`);
      }

      await worker.close();
      await queueEvents.close();
      await queue.obliterate({ force: true }).catch(() => {});
      await queue.close();

      // The production failure surfaced as stalls/timeouts, so a stall is a
      // failure here even if BullMQ eventually retries the job to success.
      expect(stalled).toEqual([]);
      expect(timings.filter((t) => !t.ok)).toEqual([]);
      expect(completed).toBe(targets.length);
    },
    TIMEOUT_MS
  );
});

describe("smtp verification suite", () => {
  it("is opt-in and never sends mail during a normal test run", () => {
    if (!ENABLED) {
      expect(ENABLED).toBe(false);
      console.log(
        "\n  SMTP end-to-end check skipped. Run it with:\n" +
          "    RUN_SMTP_VERIFY=1 npx vitest run tests/queue-send.verify.ts"
      );
    } else {
      expect(ENABLED).toBe(true);
    }
  });
});