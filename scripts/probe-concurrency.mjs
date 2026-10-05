/**
 * Isolates which knob removes the SMTP stall. Same host/creds every run; only the
 * concurrency knobs change. A single ~20s outlier under concurrency is Gmail
 * throttling sessions, not a code bug — so the fix is to send *less* at once.
 *
 * Run: node scripts/probe-concurrency.mjs
 */
import { config as loadEnv } from "dotenv";
import nodemailer from "nodemailer";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const port = Number(process.env.SMTP_PORT) || 587;
const secure =
  process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : port === 465;
const to = process.env.SMTP_USER;

const makePool = (maxConnections, rateLimit) =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections,
    rateLimit,
    maxMessages: 100,
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
  });

/** Fires `total` sends with at most `concurrency` in flight, returns per-send ms. */
async function burst(transporter, total, concurrency) {
  const timings = [];
  let next = 0;

  async function lane() {
    while (next < total) {
      const i = next++;
      const started = Date.now();
      try {
        await transporter.sendMail({
          from: `"SpendWise" <${process.env.SMTP_USER}>`,
          to,
          subject: `Concurrency probe c=${concurrency} #${i}`,
          html: "<p>probe</p>",
        });
        timings.push({ i, ms: Date.now() - started, ok: true });
      } catch (err) {
        timings.push({ i, ms: Date.now() - started, ok: false, error: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, lane));
  return timings;
}

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

for (const [concurrency, maxConnections, rateLimit] of [
  [5, 3, 5],
  [2, 2, 2],
  [1, 1, 1],
]) {
  const transporter = makePool(maxConnections, rateLimit);
  const started = Date.now();
  const timings = await burst(transporter, 10, concurrency);
  const wall = Date.now() - started;
  const times = timings.map((t) => t.ms).sort((a, b) => a - b);
  const failures = timings.filter((t) => !t.ok);

  console.log(
    `\nconcurrency=${concurrency} maxConnections=${maxConnections} rateLimit=${rateLimit}/s`
  );
  console.log(`  wall=${wall}ms  ok=${timings.length - failures.length}/${timings.length}`);
  console.log(
    `  per-send ms: min=${times[0]} p50=${pct(times, 0.5)} p90=${pct(times, 0.9)} max=${times[times.length - 1]}`
  );
  if (failures.length) console.log(`  failures: ${failures.map((f) => f.error).join("; ")}`);

  transporter.close();
  // Let the provider cool down between configurations.
  await new Promise((r) => setTimeout(r, 5_000));
}

console.log("\nIf lower concurrency removes the multi-second outliers, the fix is serialising sends.");