import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { sendEmail } from "@/lib/mail";
import { logger } from "@/lib/logger";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    logger.warn("Unauthorized 2FA override attempt", { ip: req.headers.get("x-forwarded-for") });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, adminPassword, reason } = await req.json();
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

    // 1. Verify admin password
    if (adminPassword !== (process.env.ADMIN_OVERRIDE_PASSWORD || "admin123")) {
      logger.error("Invalid admin password for 2FA override", { userId, ip });
      return NextResponse.json({ error: "Invalid admin password" }, { status: 403 });
    }

    // 2. Disable 2FA
    const user = await (prisma as any).user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false }
    });

    logger.info("Admin disabled 2FA for user", { targetEmail: user.email, reason });

    // 3. Log to audit trail
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin",
        adminId: "65f1a2b3c4d5e6f7a8b9c0d1", // Placeholder admin ID
        actionType: "2FA_RESET",
        target: user.email,
        details: `2FA force disabled by admin. Reason: ${reason}`,
        ip
      }
    });

    // 4. Send warning email using template
    try {
      // Get assigned template name from settings
      const settingsRow = await (prisma as any).settings.findUnique({ where: { key: "systemTemplates" } });
      const systemTemplates = settingsRow ? JSON.parse(settingsRow.value) : {};
      const templateName = systemTemplates.twoFactorOverride || "2FA Admin Override";

      const template = await (prisma as any).emailTemplate.findUnique({ where: { name: templateName } });

      if (template) {
        const { replaceVariables, wrapLayout } = await import("@/lib/mail");
        const variables = {
          userName: user.name || "User",
          reason: reason || "No reason provided",
          date: new Date().toLocaleDateString()
        };

        const subject = replaceVariables(template.subject, variables);
        const body = replaceVariables(template.body, variables);

        await sendEmail(user.email, subject, wrapLayout(body));
      } else {
        // Fallback to hardcoded if template not found
        await sendEmail(
          user.email,
          "Security Update: 2FA Disabled by Administrator",
          `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #DC2626;">Security Override Alert</h2>
            <p>Hello ${user.name || "User"},</p>
            <p>This is a formal notification that your Two-Factor Authentication (2FA) has been <strong>disabled by a SpendWise Administrator</strong>.</p>
            <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; border: 1px solid #FEE2E2; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason provided:</strong> ${reason}</p>
            </div>
            <p>If you did not request this or believe this was an error, please contact support immediately.</p>
            <p style="margin-top: 30px;">Best,<br/> <strong>SpendWise Security Team</strong></p>
          </div>
          `
        );
      }
    } catch (err) {
      logger.error("Failed to send 2FA override email", { error: err, email: user.email });
    }

    return NextResponse.json({ message: "2FA has been disabled and user notified." });
  } catch (error) {
    logger.error("2FA Override API internal error", { error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
