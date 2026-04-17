import nodemailer from "nodemailer";

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: `"SpendWise" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to SpendWise!",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Hi ${name || "there"},</h2>
        <p>Welcome to SpendWise! We're thrilled to have you onboard.</p>
        <p>With SpendWise, you can seamlessly track your expenses, manage budgets, and achieve your financial goals.</p>
        <p style="margin-top: 30px;">Best Regards,<br/> <strong>The SpendWise Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
};

export const send2FAToggleEmail = async (email: string, status: boolean, systemInfo: any) => {
  const transporter = getTransporter();
  const actionText = status ? "enabled" : "disabled";
  const mailOptions = {
    from: `"SpendWise Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Security Alert: 2FA was ${actionText}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Security Update</h2>
        <p>Two-factor authentication (2FA) for your SpendWise account has been successfully <strong>${actionText}</strong>.</p>
        <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Action details:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>IP Address:</strong> ${systemInfo?.ip || "Unknown"}</li>
            <li><strong>User Agent:</strong> ${systemInfo?.userAgent || "Unknown"}</li>
            <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
          </ul>
        </div>
        <p>If you did not perform this action, please secure your account immediately.</p>
        <p style="margin-top: 30px;">Best,<br/> <strong>The SpendWise Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send 2FA toggle email:", err);
  }
};

export const send2FACodeEmail = async (email: string, code: string) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: `"SpendWise Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your SpendWise 2FA Code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; color: #333; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #4F46E5;">Verification Code</h2>
        <p>Please use the following code to access your account:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; background: #F9FAFB; border-radius: 8px; display: inline-block; margin: 20px 0; color: #111827;">
          ${code}
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
        <p style="margin-top: 30px; text-align: left;">Best,<br/> <strong>The SpendWise Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send 2FA code email:", err);
  }
};
