/**
 * Probe: is the Gmail account being throttled by *cumulative* send rate?
 *
 * Context: single-connection config is already correct and a 12-message burst
 * passed. The campaign that followed still stalled at ~30s per attempt. The
 * remaining variable is messages-per-hour, which `rateLimit: 2` (2/sec =
 * 7200/hr) does nothing to bound.
 *
 * Sends REAL EMAILS to the configured SMTP_USER.
 *   node scripts/probe-paced.mjs [count] [gapMs]
 */
import nodemailer from "nodemailer";

const COUNT = Number(process.argv[2]) || 8;
const GAP_MS = Number(process.argv[3]) || 5000;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 60000,
});

// Pace in our own loop, NOT via nodemailer's rateLimit: sendMail blocks until the
// limiter releases, which would fold the wait into the latency sample and make
// every send look "throttled". Sleeping here keeps the sample pure SMTP time.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const samples = [];
for (let i = 1; i <= COUNT; i++) {
  if (i > 1) await sleep(GAP_MS);
  const t0 = Date.now();
  try {
    const info = await transporter.sendMail({
      from: `"Expense Tracker" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `Paced probe ${i}/${COUNT} gap=${GAP_MS}ms`,
      text: "paced probe",
      html: "<p>paced probe</p>",
    });
    const ms = Date.now() - t0;
    samples.push(ms);
    console.log(`  #${String(i).padStart(2)}  ${String(ms).padStart(6)}ms  OK   ${info.messageId}`);
  } catch (err) {
    const ms = Date.now() - t0;
    samples.push(ms);
    console.log(`  #${String(i).padStart(2)}  ${String(ms).padStart(6)}ms  FAIL ${err.message}`);
  }
}

const sorted = [...samples].sort((a, b) => a - b);
const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
console.log(`\n  gap=${GAP_MS}ms n=${samples.length} min=${sorted[0]} p50=${p(0.5)} p90=${p(0.9)} max=${sorted.at(-1)}`);
const failures = samples.length - COUNT;
console.log(
  failures > 0 || samples.some((s) => s > 8000)
    ? "  VERDICT: THROTTLED — a send exceeded 8s or failed"
    : "  VERDICT: CLEAN — every send under 8s"
);
transporter.close();
process.exit(0);
