/**
 * Replicates lib/mail.ts's EXACT transporter options and sends one real message,
 * with per-phase timing. Answers: does the pooled config itself hang, or is the
 * hang introduced by the caller (worker/lock/queue)?
 *
 * Run: node scripts/probe-pooled-send.mjs [recipient]
 */
import { config as loadEnv } from "dotenv";
import nodemailer from "nodemailer";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const port = Number(process.env.SMTP_PORT) || 587;
const secure =
  process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : port === 465;
const to = process.argv[2] || process.env.SMTP_USER;

const options = {
  host: process.env.SMTP_HOST,
  port,
  secure,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  rateLimit: 5,
  connectionTimeout: 30_000,
  greetingTimeout: 30_000,
  socketTimeout: 60_000,
};

console.log("Options in play:");
console.log(
  `  host=${options.host} port=${port} secure=${secure} pool=true ` +
    `maxConnections=3 rateLimit=5 connectionTimeout=30000 greetingTimeout=30000`
);
console.log(`  recipient: ${to}\n`);

const transporter = nodemailer.createTransport(options);
transporter.on("idle", () => console.log("  [event] pool idle"));

const send = async (label) => {
  const started = Date.now();
  try {
    const info = await transporter.sendMail({
      from: `"SpendWise" <${process.env.SMTP_USER}>`,
      to,
      subject: `Pooled send probe (${label}) ${new Date().toISOString()}`,
      html: "<p>Connectivity probe.</p>",
    });
    console.log(`  ${label}: SENT in ${Date.now() - started}ms (${info.messageId})`);
    return true;
  } catch (err) {
    console.log(`  ${label}: FAILED in ${Date.now() - started}ms -> ${err.message}`);
    return false;
  }
};

console.log("[1] Single send on a cold pool");
await send("single/cold");

console.log("\n[2] Five concurrent sends (mirrors worker concurrency: 5)");
const started = Date.now();
const results = await Promise.all([
  send("concurrent/1"),
  send("concurrent/2"),
  send("concurrent/3"),
  send("concurrent/4"),
  send("concurrent/5"),
]);
console.log(`  all five settled in ${Date.now() - started}ms; ok=${results.filter(Boolean).length}/5`);

console.log("\n[3] Ten sequential sends on the warm pool");
for (let i = 1; i <= 10; i++) await send(`sequential/${i}`);

transporter.close();
console.log("\nDone.");