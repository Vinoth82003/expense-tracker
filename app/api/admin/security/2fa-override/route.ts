import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import {
  verifyAdminOverridePassword,
  isStepUpRateLimited,
  registerStepUpFailure,
  clearStepUpFailures,
} from "@/lib/admin-step-up";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { sendEmail } from "@/lib/mail";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized 2FA override attempt", { ip: req.headers.get("x-forwarded-for") });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, adminPassword, reason } = await req.json();
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

    if (!userId || typeof reason !== "string" || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "A target user and a reason (min 3 chars) are required." },
        { status: 400 }
      );
    }

    if (isStepUpRateLimited(ip)) {
      logger.warn("Step-up rate limit hit on 2FA override", { ip });
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    // 1. Verify step-up credential (hash-aware, constant-time, never stored)
    // SECURITY FIX: VULN-006 — No hardcoded fallback; override secret must be set
    if (!verifyAdminOverridePassword(adminPassword)) {
      registerStepUpFailure(ip);
      logger.error("Invalid admin password for 2FA override", { userId, ip });
      return NextResponse.json({ error: "Invalid admin password" }, { status: 403 });
    }
    clearStepUpFailures(ip);

    // 2. Disable 2FA — reject self-targeting to avoid admin self-lockout.
    const adminInfoPre = await getAdminInfo();
    const target = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (adminInfoPre?.adminId === target.id) {
      return NextResponse.json(
        { error: "Refusing to disable 2FA on your own admin account." },
        { status: 400 }
      );
    }

    const user = await (prisma as any).user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });

    logger.info("Admin disabled 2FA for user", { targetEmail: user.email, reason });

    // 3. Log to audit trail
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const adminInfo = await getAdminInfo();
    const safeAdminId = (adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId))
      ? adminInfo.adminId
      : "000000000000000000000000";
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: safeAdminId,
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
