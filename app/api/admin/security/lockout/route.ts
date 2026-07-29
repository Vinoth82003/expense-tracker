import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutomatedEmail } from "@/lib/mail";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

// SECURITY FIX: VULN-006 — Removed hardcoded "admin123"; verify against ADMIN_PASS env var + bcrypt hash

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized attempt to access lockout API", { ip: req.headers.get("x-forwarded-for") });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, action, reason, adminPassword } = await req.json();

    if (!userId || !action || !reason || !adminPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Admin Password — compare against env var with bcrypt
    const adminPass = process.env.ADMIN_PASS || "";
    const isPasswordValid = bcrypt.compareSync(adminPassword, bcrypt.hashSync(adminPass, 10)) || adminPassword === adminPass;
    if (!isPasswordValid) {
      logger.error("Invalid admin password for security action", { action, userId });
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

    logger.info(`Admin performed ${action} on user`, { targetEmail: user.email, reason });

    // 4. Log to Audit Trail
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    const adminInfo = await getAdminInfo();
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: adminInfo?.adminId || "unknown",
        actionType: isLocked ? "USER_LOCKED" : "USER_UNLOCKED",
        target: user.email,
        details: `Account ${isLocked ? 'locked' : 'unlocked'}. Reason: ${reason}`,
        ip
      }
    });

    // 5. Send Notification Email
    try {
      if (isLocked) {
        await sendAutomatedEmail(user.email, "accountLockout", {
          userName: user.name || "User",
          reason: reason || "No reason provided",
          date: new Date().toLocaleDateString()
        });
      } else {
        await sendAutomatedEmail(user.email, "accountUnlock", {
          userName: user.name || "User"
        });
      }
    } catch (err) {
      logger.error("Failed to send lockout/unlock email", { error: err, email: user.email });
    }

    return NextResponse.json({ message: `Account ${isLocked ? 'locked' : 'unlocked'} successfully.` });
  } catch (error) {
    logger.error("Lockout API internal error", { error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
