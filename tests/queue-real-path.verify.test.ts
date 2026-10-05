/**
 * End-to-end verification of the REAL send path — this time through the app's own
 * `lib/queue.ts`, not a reimplementation of it.
 *
 * The earlier `tests/queue-send.verify.test.ts` reimplemented the worker inline and
 * called `sendEmail` directly, so it never exercised `jobProcessor` — i.e. the
 * template wrapping, the Redis progress tally, or the Prisma write. Production job
 * 132 failed there while the reimplementation passed, so the processor is the
 * suspect and this test covers it.
 *
 * SENDS REAL EMAILS. Opt in explicitly:
 *
 *   RUN_SMTP_VERIFY=1 npx vitest run tests/queue-real-path.verify.test.ts
 */
import { describe, it, expect } from "vitest";
import { prisma } from "../lib/prisma";
// Importing this module constructs the real BullMQ worker on `emailQueue` as a side
// effect — that is the whole point here.
import { emailQueue, getNotificationProgress } from "../lib/queue";

const ENABLED = process.env.RUN_SMTP_VERIFY === "1";
const COUNT = Number(process.env.SMTP_VERIFY_COUNT) || 1;
const TIMEOUT_MS = 180_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe.skipIf(!ENABLED)("real queue path (lib/queue.ts jobProcessor)", () => {
  it(
    "delivers a campaign through the app's own worker",
    async () => {
      const recipient = process.env.SMTP_VERIFY_RECIPIENTS || process.env.SMTP_USER;

      const notification = await (prisma as any).notification.create({
        data: {
          subject: `Real-path verification ${new Date().toISOString()}`,
          body: "Verification body {userName}",
          recipientCount: COUNT,
          recipientFilter: JSON.stringify({ specificEmail: recipient }),
          status: "PROCESSING",
          adminName: "verify",
        },
      });

      const jobs = await Promise.all(
        Array.from({ length: COUNT }, () =>
          emailQueue.add("send-email", {
            userId: "verify",
            userEmail: recipient,
            userName: "Verification",
            subject: notification.subject,
            body: notification.body,
            notificationId: notification.id,
            recipientCount: COUNT,
          })
        )
      );
      console.log(`  enqueued ${jobs.length} job(s) as ${jobs.map((j) => j.id).join(", ")}`);

      // Poll the same signals the send endpoint and the admin UI read.
      const isTerminal = (s: string) => s === "completed" || s === "failed";
      const deadline = Date.now() + TIMEOUT_MS;
      let progress = null as Awaited<ReturnType<typeof getNotificationProgress>>;
      let states: string[] = [];
      while (Date.now() < deadline) {
        await sleep(1000);
        progress = await getNotificationProgress(notification.id);
        states = await Promise.all(jobs.map((j) => j.getState()));
        const row = await (prisma as any).notification.findUnique({
          where: { id: notification.id },
          select: { status: true, error: true },
        });
        // attemptsMade + failedReason expose the per-attempt SMTP timing that the
        // aggregate state hides: a job cycling through backoff looks merely
        // "delayed", which is indistinguishable from healthy waiting.
        const detail = states
          .map((s, i) => {
            if (!isTerminal(s)) {
              const job = jobs[i] as unknown as {
                attemptsMade: number;
                failedReason?: string;
              };
              return `${s}#${i + 1}(try=${job.attemptsMade + 1},${job.failedReason ?? "-"})`;
            }
            return `${s}#${i + 1}`;
          })
          .join(" ");
        console.log(
          `  t=${Math.round((TIMEOUT_MS - (deadline - Date.now())) / 1000)}s ${detail} ` +
            `progress=${JSON.stringify(progress)} row=${JSON.stringify(row)}`
        );
        if (row?.status && row.status !== "PROCESSING") break;
        if (states.every(isTerminal)) break;
      }

      const row = await (prisma as any).notification.findUnique({
        where: { id: notification.id },
        select: { status: true, error: true },
      });

      // BullMQ flips state slightly *after* the processor returns; re-read so a
      // just-finished job is not reported as still active.
      states = await Promise.all(jobs.map((j) => j.getState()));
      for (let i = 0; i < 15 && !states.every(isTerminal); i++) {
        await sleep(500);
        states = await Promise.all(jobs.map((j) => j.getState()));
      }
      progress = await getNotificationProgress(notification.id);

      console.log(`  final: states=${states.join(",")} row=${JSON.stringify(row)}`);
      if (states.includes("failed")) {
        const reasons = jobs
          .map((j, i) => `${i + 1}: ${(j as unknown as { failedReason?: string }).failedReason}`)
          .filter((r) => !r.endsWith("undefined"));
        console.error(`  failedReasons: ${reasons.join(" | ")}`);
      }

      expect(states, "every job reached a terminal state").not.toContain("active");
      expect(states, "every job succeeded").not.toContain("failed");
      expect(row?.status).toBe("SUCCESS");
      expect(progress?.delivered).toBe(COUNT);
    },
    TIMEOUT_MS
  );
});

describe("real-path verification suite", () => {
  it("is opt-in", () => {
    if (!ENABLED) {
      console.log(
        "\n  Real send-path check skipped. Run with:\n" +
          "    RUN_SMTP_VERIFY=1 npx vitest run tests/queue-real-path.verify.test.ts"
      );
    }
    expect(ENABLED).toBe(process.env.RUN_SMTP_VERIFY === "1");
  });
});
