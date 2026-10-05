/**
 * Probe: what does a pooled transporter do AFTER close()?
 *
 * lib/mail.ts recycles the pool 30s after it goes idle (POOL_IDLE_CLOSE_MS) while
 * keeping the same cached transporter. If nodemailer treats close() as terminal,
 * the next send on that cached object hangs or fails — and the campaign would fail
 * in a burst pattern right after a quiet period.
 *
 * Sends REAL EMAILS. Uses a short idle window (3s) because only the mechanism
 * matters, not the duration.
 */
import nodemailer from "nodemailer";

const IDLE_MS = Number(process.argv[2]) || 3000;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
  rateLimit: 2,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 60000,
});

let inFlight = 0;
let timer;
const scheduleIdleClose = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`  [idle ${IDLE_MS}ms] closing pool...`);
    try {
      transporter.close();
      console.log("  [idle] close() returned");
    } catch (err) {
      console.log(`  [idle] close() threw: ${err.message}`);
    }
  }, IDLE_MS);
};
transporter.on("idle", scheduleIdleClose);

const send = async (label) => {
  inFlight++;
  const t0 = Date.now();
  try {
    const info = await transporter.sendMail({
      from: `"Expense Tracker" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `Pool-reuse probe: ${label}`,
      text: "probe",
      html: "<p>probe</p>",
    });
    console.log(`  ${label.padEnd(22)} ${String(Date.now() - t0).padStart(6)}ms  OK`);
    return true;
  } catch (err) {
    console.log(`  ${label.padEnd(22)} ${String(Date.now() - t0).padStart(6)}ms  FAIL  ${err.message}`);
    return false;
  } finally {
    inFlight--;
    if (inFlight === 0) scheduleIdleClose();
  }
};

console.log(`\n  send #1 (fresh pool)`);
await send("send #1 fresh");

console.log(`\n  waiting ${IDLE_MS}ms for the idle timer to close the pool...`);
await new Promise((r) => setTimeout(r, IDLE_MS + 500));

console.log(`\n  send #2 (same cached transporter, pool was closed)`);
await send("send #2 after close");

console.log(`\n  send #3 (immediately after #2)`);
await send("send #3 back-to-back");

process.exit(0);
