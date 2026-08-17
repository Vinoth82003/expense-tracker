import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateOrigin } from "@/lib/csrf";

// SECURITY FIX: VULN-015 — Escape all user inputs before HTML email interpolation

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// SECURITY FIX: VULN-026 — Server-side email format validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const limitResponse = await checkRateLimit(req, 5, 15 * 60 * 1000, "contact");
    if (limitResponse) return limitResponse;

    // SECURITY FIX: VULN-020 — CSRF origin validation
    const csrfCheck = validateOrigin(req);
    if (csrfCheck) return csrfCheck;

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // SECURITY FIX: VULN-026 — Validate email format on the server
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // SECURITY FIX: VULN-015 — Sanitize all user inputs for HTML email
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "N/A");
    const safeMessage = escapeHtml(message);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminEmail = process.env.ADMIN_USER;

    const mailOptions = {
      from: `"${safeName}" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email, // replyTo is safe as it's an email header, not rendered HTML
      subject: `Contact Form: ${safeSubject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">New Contact Message</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            APP-SOURCE: SpendWise
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error: any) {
    console.error("SMTP Error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
