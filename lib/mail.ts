import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";
import { logger } from "./logger";
import { appUrl } from "./site-url";

/**
 * SMTP TRANSPORT
 *
 * nodemailer only reuses connections when the transport is created with
 * `pool: true`. A plain SMTPTransport builds a brand-new TCP + TLS + AUTH
 * handshake for *every* `sendMail()` call, which is exactly what a bulk send
 * punishes: a campaign produces hundreds of handshakes in a burst, the provider
 * throttles them, and sends fail with "Connection timeout". That is the root
 * cause of the production 500 on `POST /api/admin/notifications/send`.
 *
 * So: ONE pooled, rate-limited transporter shared by every send, closed shortly
 * after it goes idle. That keeps the connection warm across a campaign while
 * still releasing it between sends. Gmail drops connections left idle for ~60s,
 * so the pool is recycled well inside that window.
 */
const envInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Pool settings (maxConnections / rateLimit) live on the pool transport's options. */
type SmtpOptions = SMTPPool.Options;

const DEFAULT_SMTP_PORT = 587;

/**
 * How long the pool may sit unused before it is closed — and whether it is closed
 * at all.
 *
 * DEFAULT IS 0 = NEVER CLOSE, and that is deliberate. `close()` is terminal for a
 * nodemailer pool: it sets `_closed = true`, after which `SMTPPool.send()` returns
 * false *without invoking its callback*. A send on a closed pool therefore
 * neither resolves nor rejects — it hangs forever, and BullMQ surfaces it much
 * later as an opaque "SMTP Error: Connection timeout".
 *
 * Recycling the pool on an idle timer raced the very next campaign. Job N
 * finished, the pool was declared idle and scheduled for close, jobs N+1..
 * picked up the same cached transporter while it was still open, and the timer
 * then closed it underneath them. Those sends hung until the socket budget ran
 * out — which is precisely the production symptom: the first email of a batch
 * arrives, everything after it times out.
 *
 * Holding one pooled transporter for the process lifetime is safe: nodemailer
 * detects a socket the server has dropped and reopens it, and the process exit
 * reclaims it anyway. Opt back into recycling with SMTP_POOL_IDLE_MS if you
 * need the socket released earlier.
 */
const POOL_IDLE_CLOSE_MS = Number(process.env.SMTP_POOL_IDLE_MS) || 0;

const buildSmtpOptions = (): SmtpOptions => {
  const port = Number(process.env.SMTP_PORT) || DEFAULT_SMTP_PORT;

  const missing = (["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const).filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    // Failing loudly here beats a silent 30s connect timeout per recipient.
    throw new Error(
      `SMTP is not configured: missing ${missing.join(", ")}. ` +
        `Set these in the environment (see .env.example) before sending mail.`
    );
  }

  return {
    host: process.env.SMTP_HOST,
    port,
    // Implicit TLS on 465, STARTTLS otherwise. (Comparing the raw env *string*
    // to "465" previously meant a whitespace-padded port silently fell back to
    // an unencrypted plaintext connection.)
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    // 1 by default. Gmail throttles *concurrent sessions* from a single account,
    // and the symptom is deceptive: it does not reject the extra sends, it stalls
    // them. Measured against smtp.gmail.com with the real credentials —
    //   concurrency 5 / 3 conns: p50 6568ms, p90 16357ms
    //   concurrency 2 / 2 conns: p50 2324ms, p90 16743ms
    //   concurrency 1 / 1 conn : p50  1812ms, p90   4331ms
    // At concurrency 5 a stalled send exceeded the 30s connection timeout and
    // surfaced as "SMTP Error: Connection timeout" — the exact production error,
    // with no rejection anywhere in the logs to explain it. Serialising trades
    // throughput (~1.8s/message) for reliability.
    maxConnections: envInt(process.env.SMTP_MAX_CONNECTIONS, 1),
    // Recycle each connection rather than holding one open indefinitely.
    maxMessages: 100,
    // Ceiling on how fast messages may *start*. A safety valve; with a single
    // connection and ~1.8s per send the natural rate is already below it.
    rateLimit: envInt(process.env.SMTP_RATE_LIMIT_PER_SECOND, 2),
    // Deliberately short. A host that cannot complete TCP+TLS+AUTH quickly is not
    // going to succeed at all, and these must stay well under the BullMQ worker
    // `lockDuration` (see lib/queue.ts): when they matched the lock, a stalled
    // connection expired the job's lock at the same instant, BullMQ re-queued it
    // as *stalled* instead of retrying it, and the exponential backoff below never
    // got a chance to engage.
    connectionTimeout: envInt(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10_000),
    greetingTimeout: envInt(process.env.SMTP_GREETING_TIMEOUT_MS, 10_000),
    socketTimeout: envInt(process.env.SMTP_SOCKET_TIMEOUT_MS, 60_000),
  };
};

type CachedTransporter = {
  signature: string;
  transporter: Transporter;
  idleTimer?: ReturnType<typeof setTimeout>;
  /** Sends currently using this pool. The pool must never be closed while > 0. */
  inFlight: number;
};

let cachedTransporter: CachedTransporter | null = null;

const signatureOf = (options: SmtpOptions) =>
  [options.host, options.port, options.secure, options.auth?.user].join("|");

/**
 * Non-throwing config check, so a misconfigured deployment fails the individual
 * send with a readable reason instead of an opaque "Connection timeout".
 * `buildSmtpOptions()` throws on the same conditions as a backstop.
 */
function assertSmtpConfigured(): string | null {
  const missing = (["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const).filter(
    (key) => !process.env[key]
  );
  return missing.length ? `SMTP not configured (missing: ${missing.join(", ")})` : null;
}

function getTransporter(): Transporter {
  const options = buildSmtpOptions();
  const signature = signatureOf(options);

  if (cachedTransporter?.signature === signature) {
    return cachedTransporter.transporter;
  }

  // First use, or SMTP settings changed underneath us — drop the old pool.
  if (cachedTransporter) {
    if (cachedTransporter.idleTimer) clearTimeout(cachedTransporter.idleTimer);
    cachedTransporter.transporter.close();
    cachedTransporter = null;
  }

  const transporter = nodemailer.createTransport(options);
  cachedTransporter = { signature, transporter, inFlight: 0 };

  // Pool options are read from the TOP level of the transport config, never from a
  // `pool: {}` sub-object — nodemailer silently ignores the nested shape and falls
  // back to 5 connections with no rate limit, which is what reintroduced the
  // stalling that serialising was meant to prevent. Log what was actually applied
  // so a silent fallback is visible instead of theoretical.
  const applied = (transporter as unknown as {
    transporter?: { options?: Record<string, unknown>; _rateLimit?: { limit?: number } };
  }).transporter;
  logger.info(
    `SMTP pool created: ${options.host}:${options.port} secure=${options.secure} ` +
      `maxConnections=${applied?.options?.maxConnections} maxMessages=${applied?.options?.maxMessages} ` +
      `rateLimit=${applied?._rateLimit?.limit} connectionTimeout=${options.connectionTimeout} ` +
      `greetingTimeout=${options.greetingTimeout} socketTimeout=${options.socketTimeout} ` +
      `idleCloseMs=${POOL_IDLE_CLOSE_MS}`,
    null,
    "MAIL"
  );

  transporter.on("idle", () => {
    if (cachedTransporter?.transporter !== transporter) return;
    armIdleRelease();
  });

  /**
   * Optionally release the pool once it has been idle AND unused for
   * POOL_IDLE_CLOSE_MS. Disabled by default — see POOL_IDLE_CLOSE_MS for why a
   * timed close is unsafe. The cache is always dropped *before* closing, so even
   * when enabled the next send builds a fresh pool rather than reusing a dead one.
   */
  function armIdleRelease(): void {
    if (POOL_IDLE_CLOSE_MS <= 0) return;
    const entry = cachedTransporter;
    if (!entry || entry.transporter !== transporter) return;
    if (entry.idleTimer) clearTimeout(entry.idleTimer);

    const timer = setTimeout(() => {
      if (cachedTransporter !== entry) return;

      // Closing a pool mid-send kills the in-flight SMTP socket and surfaces as a
      // bogus connection timeout, so the close waits until the pool is both idle
      // *and* unused. At low send rates the pool would otherwise be torn down
      // between messages and every send would pay a fresh handshake.
      if (entry.inFlight > 0) {
        logger.info(
          `Deferring idle SMTP pool release — ${entry.inFlight} send(s) still in flight`,
          null,
          "MAIL"
        );
        // Must re-arm: this timer has already fired, and `idle` only fires again
        // when the pool drains, so without this the pool is never released.
        armIdleRelease();
        return;
      }

      cachedTransporter = null;
      logger.info("Releasing idle SMTP connection pool", null, "MAIL");
      entry.transporter.close();
    }, POOL_IDLE_CLOSE_MS);

    timer.unref?.();
    entry.idleTimer = timer;
  }

  return transporter;
}

/**
 * Replaces placeholders like {userName}, {date}, etc. in a string
 */
export const replaceVariables = (text: string, variables: Record<string, string>) => {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, "g");
    result = result.replace(regex, value || "");
  });
  return result;
};

/**
 * Wraps content in a beautiful SpendWise branded layout
 */
export const wrapLayout = (content: string, recipientEmail = "") => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f9; color: #1f2937; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
          .header { background: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f3f4f6; }
          .logo-box { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
          .brand-name { font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin: 0; }
          .brand-name span { color: #0d9488; }
          .content { padding: 40px; line-height: 1.6; font-size: 16px; }
          .footer { background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #f3f4f6; }
          .footer p { margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; }
          h2 { color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 20px; }
          .security-box { background: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 16px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-box">
              <img src="${appUrl("/web-app-manifest-192x192.png")}" width="48" height="48" alt="SpendWise Logo" style="display: block; border-radius: 14px;" />
            </div>
            <h1 class="brand-name">Spend<span>Wise</span></h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SpendWise Inc. All rights reserved.</p>
            <p>Financial forensics at your fingertips.</p>
            <p style="margin-top: 10px;">
              <a href="${appUrl("/feedback")}" style="color: #0d9488; text-decoration: none; font-weight: bold;">Share Feedback</a>
              &nbsp;·&nbsp;
              <a href="${appUrl("/settings")}" style="color: #9ca3af; text-decoration: none;">Manage Notifications</a>
              &nbsp;·&nbsp;
              <a href="${appUrl(`/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}`)}" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const variables = { userName: name || "User" };
  const subject = "Welcome to SpendWise!";
  const content = `
    <h2>Hi ${variables.userName},</h2>
    <p>Welcome to SpendWise! We're thrilled to have you onboard.</p>
    <p>With SpendWise, you can seamlessly track your expenses, manage budgets, and achieve your financial goals using our state-of-the-art forensic AI.</p>
    <p>Get started by setting up your first budget threshold!</p>
    <a href="${appUrl("/dashboard")}" class="button">Go to Dashboard</a>
    <p style="margin-top: 30px;">Best Regards,<br/> <strong>The SpendWise Team</strong></p>
  `;

  return sendEmail(email, subject, wrapLayout(content, email));
};

export const send2FAToggleEmail = async (email: string, status: boolean, systemInfo: any) => {
  const actionText = status ? "enabled" : "disabled";
  const subject = `Security Alert: 2FA was ${actionText}`;
  const content = `
    <h2>Security Update</h2>
    <p>Two-factor authentication (2FA) for your SpendWise account has been successfully <strong>${actionText}</strong>.</p>
    <div class="security-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #111827;">Action details:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
        <li><strong>IP Address:</strong> ${systemInfo?.ip || "Unknown"}</li>
        <li><strong>User Agent:</strong> ${systemInfo?.userAgent || "Unknown"}</li>
        <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
      </ul>
    </div>
    <p>If you did not perform this action, please secure your account immediately.</p>
    <p style="margin-top: 30px;">Best,<br/> <strong>The SpendWise Team</strong></p>
  `;

  return sendEmail(email, subject, wrapLayout(content, email));
};

export const send2FACodeEmail = async (email: string, code: string) => {
  const subject = `Your SpendWise 2FA Code: ${code}`;
  const content = `
    <div style="text-align: center;">
      <h2>Verification Code</h2>
      <p>Please use the following code to access your account:</p>
      <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 20px; background: #f9fafb; border: 2px dashed #0d9488; border-radius: 16px; display: inline-block; margin: 20px 0; color: #111827;">
        ${code}
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  return sendEmail(email, subject, wrapLayout(content, email));
};

export const sendBudgetAlertEmail = async (email: string, name: string, spentPercent: number, spent: number, limit: number) => {
  const subject = `⚠️ SpendWise: You've reached ${spentPercent}% of your monthly budget`;
  const content = `
    <h2>Budget Alert, ${name || "there"}!</h2>
    <p>You've used <strong>${spentPercent}%</strong> of your monthly budget limit.</p>
    <div class="security-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #111827;">This month so far:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
        <li><strong>Amount Spent:</strong> ₹${spent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</li>
        <li><strong>Monthly Limit:</strong> ₹${limit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</li>
        <li><strong>Remaining:</strong> ₹${(limit - spent).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</li>
      </ul>
    </div>
    <p>Review your spending patterns and adjust your budget if needed.</p>
    <a href="${appUrl("/dashboard")}" class="button">View Dashboard</a>
    <p style="margin-top: 30px;">Best,<br/> <strong>The SpendWise Team</strong></p>
  `;
  return sendEmail(email, subject, wrapLayout(content, email));
};

export const sendFeedbackRequestEmail = async (email: string, name: string) => {
  const subject = "Help us improve SpendWise! ⭐";
  const content = `
    <h2>Hi ${name || "User"},</h2>
    <p>We've been working hard to make SpendWise the best forensic financial tool for you.</p>
    <p>Could you spare a minute to share your feedback? Your insights help us prioritize features that matter most to you.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl("/feedback")}" class="button">Share My Experience</a>
    </div>
    <p>Thank you for being a valued member of the SpendWise community!</p>
    <p style="margin-top: 30px;">Best Regards,<br/> <strong>The SpendWise Team</strong></p>
  `;

  return sendEmail(email, subject, wrapLayout(content, email));
};

export const sendGroupInvitationEmail = async (email: string, inviterName: string, groupName: string, inviteLink: string) => {
  const subject = `You're invited to join ${groupName} on SpendWise!`;
  const content = `
    <h2>Hi there!</h2>
    <p><strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on SpendWise.</p>
    <p>By joining this group, you can easily split expenses, track who owes what, and manage shared finances with ${inviterName} and others.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" class="button">Join Group</a>
    </div>
    <p>If you don't have a SpendWise account yet, you'll be able to create one after clicking the link above.</p>
    <p style="margin-top: 30px;">Best,<br/> <strong>The SpendWise Team</strong></p>
  `;

  return sendEmail(email, subject, wrapLayout(content, email));
};

/**
 * Sends an automated system email based on a configured template key
 */
export const sendAutomatedEmail = async (email: string, templateKey: string, variables: Record<string, string>) => {
  try {
    const { prisma } = await import("./prisma");
    
    // 1. Get the systemTemplates setting
    const setting = await (prisma as any).settings.findUnique({
      where: { key: "systemTemplates" }
    });

    if (!setting) return { success: false, error: "Settings not found" };
    
    const templatesMap = JSON.parse(setting.value);
    const templateName = templatesMap[templateKey];

    if (!templateName) return { success: false, error: `No template mapped for ${templateKey}` };

    // 2. Fetch the actual template content
    const template = await (prisma as any).emailTemplate.findUnique({
      where: { name: templateName }
    });

    if (!template) return { success: false, error: "Template content not found" };

    // 3. Process and send
    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);
    const html = wrapLayout(body.replace(/\n/g, '<br/>'), email);

    return sendEmail(email, subject, html);
  } catch (err: any) {
    console.error("Failed to send automated email:", err);
    return { success: false, error: err.message };
  }
};

const ADMIN_EMAIL = process.env.EMAIL || process.env.ADMIN_USER || "";

/**
 * Sends admin notification when a new user registers
 */
export const sendAdminNewUserNotification = async (newUserEmail: string, userName: string, method: string) => {
  if (!ADMIN_EMAIL) {
    await logger.warn("Admin email not configured – skipping new-user notification", { newUserEmail }, "MAIL");
    return { success: false, error: "Admin email not configured" };
  }

  const subject = `New User Registered on SpendWise`;
  const content = `
    <h2>New User Registration</h2>
    <p>A new user has just signed up on SpendWise.</p>
    <div class="security-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #111827;">Registration Details:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
        <li><strong>Email:</strong> ${newUserEmail}</li>
        <li><strong>Name:</strong> ${userName || "Not provided"}</li>
        <li><strong>Method:</strong> ${method}</li>
        <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
      </ul>
    </div>
    <p style="margin-top: 30px;">Best,<br/> <strong>SpendWise System</strong></p>
  `;

  return sendEmail(ADMIN_EMAIL, subject, wrapLayout(content, ADMIN_EMAIL));
};

/**
 * Admin notification when a user erases all of their transaction data.
 * The account survives; only the expense/income rows are removed.
 */
export const sendAdminDataWipeNotification = async (
  userEmail: string,
  userName: string,
  deletedExpenses: number,
  deletedIncomes: number
) => {
  if (!ADMIN_EMAIL) {
    await logger.warn("Admin email not configured – skipping data-wipe notification", { userEmail }, "MAIL");
    return { success: false, error: "Admin email not configured" };
  }

  const subject = `SpendWise: A user erased all transaction data`;
  const content = `
    <h2>Destructive Action: Transaction Data Wiped</h2>
    <p>A user erased all of their expense and income records. Their account is still active; only transaction data was removed.</p>
    <div class="security-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #111827;">Wipe details:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Name:</strong> ${userName || "Not provided"}</li>
        <li><strong>Expenses deleted:</strong> ${deletedExpenses}</li>
        <li><strong>Income records deleted:</strong> ${deletedIncomes}</li>
        <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
      </ul>
    </div>
    <p style="margin-top: 30px;">Best,<br/> <strong>SpendWise System</strong></p>
  `;

  return sendEmail(ADMIN_EMAIL, subject, wrapLayout(content, ADMIN_EMAIL));
};

/**
 * Admin notification when a user deletes their account, which also cascades to
 * their expenses, incomes, categories, budgets, and sessions.
 */
export const sendAdminAccountDeletionNotification = async (
  userEmail: string,
  userName: string
) => {
  if (!ADMIN_EMAIL) {
    await logger.warn("Admin email not configured – skipping account-deletion notification", { userEmail }, "MAIL");
    return { success: false, error: "Admin email not configured" };
  }

  const subject = `SpendWise: An account was deleted`;
  const content = `
    <h2>Destructive Action: Account Deleted</h2>
    <p>A user permanently deleted their SpendWise account. All associated records (expenses, incomes, categories, budgets, and sessions) were removed by cascade.</p>
    <div class="security-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #111827;">Deletion details:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Name:</strong> ${userName || "Not provided"}</li>
        <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
      </ul>
    </div>
    <p style="margin-top: 30px;">Best,<br/> <strong>SpendWise System</strong></p>
  `;

  return sendEmail(ADMIN_EMAIL, subject, wrapLayout(content, ADMIN_EMAIL));
};

// Debounce map to prevent email spam for rapid-fire errors
const errorEmailDebounce = new Map<string, number>();
const ERROR_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Sends admin notification when an API endpoint fails with a 500 error.
 * Debounced per endpoint to avoid flooding the admin inbox.
 */
export const sendAdminApiErrorNotification = async (
  endpoint: string,
  method: string,
  error: any,
  ip?: string,
  userId?: string
) => {
  if (!ADMIN_EMAIL) {
    return { success: false, error: "Admin email not configured" };
  }

  const debounceKey = `${method}:${endpoint}`;
  const lastSent = errorEmailDebounce.get(debounceKey) || 0;
  if (Date.now() - lastSent < ERROR_DEBOUNCE_MS) {
    return { success: false, error: "Debounced – skipping duplicate error email" };
  }
  errorEmailDebounce.set(debounceKey, Date.now());

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : "";

  const subject = `API Error: ${method} ${endpoint} returned 500`;
  const content = `
    <h2>API Endpoint Failure</h2>
    <p>An API endpoint encountered an unhandled error and returned a <strong>500</strong> status code.</p>
    <div class="security-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #111827;">Error Details:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
        <li><strong>Endpoint:</strong> ${method} ${endpoint}</li>
        <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
        <li><strong>IP:</strong> ${ip || "Unknown"}</li>
        <li><strong>User ID:</strong> ${userId || "Unauthenticated"}</li>
        <li><strong>Error:</strong> ${errorMessage}</li>
      </ul>
    </div>
    ${errorStack ? `<div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 12px; margin-top: 16px; font-family: monospace; font-size: 12px; color: #6b7280; white-space: pre-wrap; overflow-x: auto;">${errorStack.substring(0, 2000)}</div>` : ""}
    <p style="margin-top: 30px;">Best,<br/> <strong>SpendWise System</strong></p>
  `;

  return sendEmail(ADMIN_EMAIL, subject, wrapLayout(content, ADMIN_EMAIL));
};

/**
 * Fire-and-forget logging.
 *
 * `logger.*` writes to MongoDB, and a Mongo operation that cannot select a server
 * blocks for `serverSelectionTimeoutMS` (30s by default) before failing. Awaiting
 * it inside the send path therefore put a 30s database stall in front of every
 * email — and, because the success log is written *after* the message is already
 * delivered, a stalled log could fail a job whose email had in fact been sent,
 * which then got retried and delivered twice.
 *
 * Observability must never be able to fail or delay delivery, so these are
 * deliberately not awaited and their rejections are swallowed.
 */
const logAsync = (
  level: "info" | "warn" | "error",
  message: string,
  details?: Record<string, unknown>
): void => {
  try {
    void Promise.resolve(logger[level](message, details ?? null, "MAIL")).catch(() => {});
  } catch {
    /* never let logging break a send */
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const configError = assertSmtpConfigured();
  if (configError) {
    logAsync("error", `Cannot send email: ${configError}`, { to, subject });
    return { success: false, error: configError };
  }

  // Shared, rate-limited pool - see getTransporter(). Not closed per send;
  // it releases itself once idle and unused.
  const transporter = getTransporter();
  if (cachedTransporter) cachedTransporter.inFlight += 1;
  const startedAt = Date.now();

  try {
    const info = await transporter.sendMail({
      from: `"SpendWise" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    logAsync("info", `Email sent successfully: ${subject}`, {
      to,
      messageId: info.messageId,
      durationMs: Date.now() - startedAt,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    logAsync("error", `SMTP error sending email: ${err.message}`, {
      to,
      subject,
      durationMs: Date.now() - startedAt,
      code: err?.code,
    });
    return { success: false, error: err.message };
  } finally {
    if (cachedTransporter) cachedTransporter.inFlight -= 1;
  }
};
