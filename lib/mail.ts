import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { logger } from "./logger";

/**
 * Creates a fresh non-pooled SMTP transporter for each send.
 * Pooled connections time out on Gmail after ~60s of idle,
 * causing "Connection timeout" on the 3rd+ email in a burst.
 * A fresh connection per email is more reliable for low-volume bulk sends.
 */
const createTransporter = () => {
  const options: SMTPTransport.Options = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // No pooling – avoids idle connection timeouts on Gmail (default for SMTPTransport)
    connectionTimeout: 30000, // 30s to connect
    greetingTimeout: 30000,   // 30s for SMTP greeting
    socketTimeout: 60000,     // 60s per message
  };
  return nodemailer.createTransport(options);
};

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
              <img src="https://money-spend-tracker.vercel.app/web-app-manifest-192x192.png" width="48" height="48" alt="SpendWise Logo" style="display: block; border-radius: 14px;" />
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
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/feedback" style="color: #0d9488; text-decoration: none; font-weight: bold;">Share Feedback</a>
              &nbsp;·&nbsp;
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings" style="color: #9ca3af; text-decoration: none;">Manage Notifications</a>
              &nbsp;·&nbsp;
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a>
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
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
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
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
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
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/feedback" class="button">Share My Experience</a>
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

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Fresh transporter per send — avoids Gmail idle-pool connection timeouts
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"SpendWise" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    await logger.info(`Email sent successfully: ${subject}`, { to, messageId: info.messageId }, "MAIL");
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    await logger.error(`SMTP error sending email: ${err.message}`, { to, subject }, "MAIL");
    return { success: false, error: err.message };
  } finally {
    // Close the connection cleanly after each send
    transporter.close();
  }
};
