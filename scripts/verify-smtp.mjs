/**
 * One-shot SMTP connectivity check.
 *
 * Run with:  node scripts/verify-smtp.mjs
 *
 * "SMTP Error: Connection timeout" from the queue is ambiguous by nature — it looks
 * like a code bug but is usually a config or network-reachability problem. This
 * deliberately bypasses lib/mail.ts and talks to the provider directly, so it can
 * tell those two cases apart:
 *
 *   - bad/missing credentials or wrong host/port  -> fails in the first seconds
 *   - host unreachable from this machine/region  -> reports the raw TCP timing out
 *
 * Nothing here is imported by the app, and it sends no email.
 */
import { config as loadEnv } from "dotenv";
import nodemailer from "nodemailer";
import net from "node:net";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const secure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

const problems = [];
if (!host) problems.push("SMTP_HOST is not set");
if (!user) problems.push("SMTP_USER is not set");
if (!pass) problems.push("SMTP_PASS is not set");
if (!process.env.SMTP_PORT) problems.push(`SMTP_PORT is not set — defaulting to ${port}`);

if (problems.length) {
  console.error("Configuration problems:\n  - " + problems.join("\n  - "));
  console.error("\nSee .env.example for the expected shape.");
  process.exit(1);
}

console.log(`Host      : ${host}`);
console.log(`Port      : ${port} (${secure ? "implicit TLS" : "STARTTLS"})`);
console.log(`User      : ${user}`);
console.log("Pass      : (set)");
console.log(`\n[1/2] Raw TCP reachability to ${host}:${port} ...`);

const tcp = await new Promise((resolve) => {
  const started = Date.now();
  const socket = net.connect({ host, port });
  const finish = (result) => {
    socket.destroy();
    resolve(result);
  };
  socket.setTimeout(15_000);
  socket.on("connect", () =>
    finish({ ok: true, ms: Date.now() - started, banner: "" })
  );
  socket.on("timeout", () =>
    finish({ ok: false, ms: Date.now() - started, error: "TCP connect timed out after 15s" })
  );
  socket.on("error", (err) => finish({ ok: false, ms: Date.now() - started, error: err.message }));
});

if (!tcp.ok) {
  console.error(`  FAILED after ${tcp.ms}ms: ${tcp.error}`);
  console.error(
    "\nThe host is not reachable from this machine. That is a network/egress or " +
      "firewall problem, not a bug in the mailer — no application change will fix it.\n" +
      "If this runs on AWS Lambda, test from the same region: the provider may block\n" +
      "the datacenter IP range, or outbound 25/465/587 may be restricted."
  );
  process.exit(1);
}

console.log(`  TCP connected in ${tcp.ms}ms.`);

console.log(`\n[2/2] Nodemailer handshake + auth (10s timeout) ...`);
const started = Date.now();

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 30_000,
});

try {
  const info = await transporter.verify();
  console.log(`  AUTH OK in ${Date.now() - started}ms — server reports: ${info.response}`);
  console.log(
    "\nSMTP is reachable and the credentials are valid. If sends still time out in\n" +
      "production, the problem is the volume of concurrent connections (burst\n" +
      "throttling), not reachability or credentials."
  );
  transporter.close();
  process.exit(0);
} catch (err) {
  console.error(`  FAILED after ${Date.now() - started}ms: ${err.message}`);
  console.error(
    "\nTCP is open but the SMTP session failed. Usually one of:\n" +
      "  - SMTP_PASS is a Google *App Password*, not the account password\n" +
      "  - 2-Step Verification is off, or the app password was revoked\n" +
      "  - port/secure mismatch (465 needs secure=true; 587 needs STARTTLS)"
  );
  transporter.close();
  process.exit(1);
}