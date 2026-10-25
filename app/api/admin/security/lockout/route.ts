import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import {
  verifyAdminPassword,
  isStepUpRateLimited,
  registerStepUpFailure,
  clearStepUpFailures,
} from "@/lib/admin-step-up";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutomatedEmail } from "@/lib/mail";
import { logger } from "@/lib/logger";

// SECURITY FIX: VULN-006 — Step-up credential is verified hash-aware and
// constant-time via lib/admin-step-up (no bcrypt re-hash / plaintext `===`).

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

    if (action !== "lock" && action !== "unlock") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (isStepUpRateLimited(ip)) {
      logger.warn("Step-up rate limit hit on lockout action", { ip, action });
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    // 1. Verify step-up credential (hash-aware, constant-time).
    if (!verifyAdminPassword(adminPassword)) {
      registerStepUpFailure(ip);
      logger.error("Invalid admin password for security action", { action, userId });
      return NextResponse.json({ error: "Invalid administrator password" }, { status: 403 });
    }
    clearStepUpFailures(ip);

    // 2. Fetch User
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Self-lockout guard: an admin must not lock their own account.
    const adminInfoPre = await getAdminInfo();
    if (action === "lock" && adminInfoPre?.adminId === user.id) {
      return NextResponse.json(
        { error: "Refusing to lock your own admin account." },
        { status: 400 }
      );
    }

    // 4. Update User Status
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
    const adminInfo = await getAdminInfo();
    const safeAdminId = (adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId))
      ? adminInfo.adminId
      : "000000000000000000000000";
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: safeAdminId,
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
