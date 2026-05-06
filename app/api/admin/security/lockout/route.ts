import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/mail";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, action, reason, adminPassword } = await req.json();

    if (!userId || !action || !reason || !adminPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Admin Password (simplified for demo, usually use bcrypt)
    if (adminPassword !== "admin123") {
      return NextResponse.json({ error: "Invalid administrator password" }, { status: 403 });
    }

    // 2. Fetch User
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Update User Status
    const isLocked = action === "lock";
    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        isLocked,
        lockedAt: isLocked ? new Date() : null,
        lockReason: isLocked ? reason : null
      }
    });

    // 4. Log to Audit Trail
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin",
        adminId: "65f1a2b3c4d5e6f7a8b9c0d1", // Placeholder
        actionType: isLocked ? "USER_LOCKED" : "USER_UNLOCKED",
        target: user.email,
        details: `Account ${isLocked ? 'locked' : 'unlocked'}. Reason: ${reason}`,
        ip
      }
    });

    // 5. Send Notification Email
    try {
      if (isLocked) {
        const settingsRow = await (prisma as any).settings.findUnique({ where: { key: "systemTemplates" } });
        const systemTemplates = settingsRow ? JSON.parse(settingsRow.value) : {};
        const templateName = systemTemplates.accountLockout || "Account Lockout";

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
          // Fallback
          await sendEmail(
            user.email,
            "Security Alert: Your Account Has Been Locked",
            `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #DC2626;">Account Lockout Alert</h2>
              <p>Hello ${user.name || "User"},</p>
              <p>This is a formal notification that your SpendWise account has been <strong>locked by an Administrator</strong>.</p>
              <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; border: 1px solid #FEE2E2; margin: 20px 0;">
                <p style="margin: 0;"><strong>Reason provided:</strong> ${reason}</p>
              </div>
              <p>Please contact support for further assistance.</p>
              <p style="margin-top: 30px;">Best,<br/> <strong>SpendWise Security Team</strong></p>
            </div>
            `
          );
        }
      }
    } catch (err) {
      console.error("Failed to send lockout email:", err);
    }

    return NextResponse.json({ message: `Account ${isLocked ? 'locked' : 'unlocked'} successfully.` });
  } catch (error) {
    console.error("Lockout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
