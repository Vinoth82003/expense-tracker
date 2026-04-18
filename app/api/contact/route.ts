import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminEmail = process.env.ADMIN_USER;

    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `Contact Form: ${subject || "New Message"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || "N/A"}</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
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
