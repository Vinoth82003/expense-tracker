/**
 * Diagnostic: call lib/mail.ts's sendEmail back-to-back, outside BullMQ.
 *
 * The queue-path run showed send #1 succeeding (4464ms) and sends #2+ producing no
 * log at all — not even an error. That is either nodemailer's pooled connection
 * never becoming available again, or `sendMail` resolving and the Mongo-backed
 * `logger.info` hanging afterwards. The two are indistinguishable from the queue
 * logs, because the success log (and its durationMs) is only written after
 * sendMail resolves. console.log is used here precisely because it is synchronous
 * and never touches Mongo, so it shows exactly which await hangs.
 *
 * SENDS REAL EMAILS. Opt in: RUN_SMTP_VERIFY=1
 */
import { describe, it, expect } from "vitest";
import { sendEmail } from "../lib/mail";

const ENABLED = process.env.RUN_SMTP_VERIFY === "1";
const COUNT = Number(process.env.SMTP_VERIFY_COUNT) || 3;
const TIMEOUT_MS = 120_000;

describe.skipIf(!ENABLED)("sendEmail back-to-back", () => {
  it(
    "delivers consecutive messages on the shared pool",
    async () => {
      for (let i = 1; i <= COUNT; i++) {
        const t0 = Date.now();
        console.log(`  [${i}/${COUNT}] calling sendEmail...`);
        const res = await sendEmail(
          process.env.SMTP_USER!,
          `Send-loop diagnostic ${i}/${COUNT}`,
          "<p>send loop diagnostic</p>"
        );
        console.log(`  [${i}/${COUNT}] returned in ${Date.now() - t0}ms -> ${JSON.stringify(res)}`);
        expect(res.success).toBe(true);
      }
    },
    TIMEOUT_MS
  );
});
