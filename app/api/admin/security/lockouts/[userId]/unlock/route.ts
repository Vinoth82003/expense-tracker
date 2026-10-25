import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
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
import { prismaErrorCode } from "@/lib/admin/errors";
import { validateReason } from "@/lib/admin/security-validation";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Unlock a temporarily locked account. Previously this path had no step-up, no
 * reason, and no audit — a hidden weaker sibling of /security/lockout. It now
 * enforces the identical controls (spec 11).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized unlock attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!OBJECT_ID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsedReason = validateReason(body.reason, { min: 3 });
    if (!parsedReason.ok) {
      return NextResponse.json({ error: parsedReason.error }, { status: 400 });
    }

    if (isStepUpRateLimited(ip)) {
      logger.warn("Step-up rate limit hit on unlock", { ip, userId });
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    if (!verifyAdminPassword(body.adminPassword)) {
      registerStepUpFailure(ip);
      logger.error("Invalid admin password for unlock", { userId, ip });
      return NextResponse.json({ error: "Invalid administrator password" }, { status: 403 });
    }
    clearStepUpFailures(ip);

    const admin = await getAdminInfo();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isLocked: false, lockedAt: null, lockReason: null },
      select: { id: true, email: true, name: true },
    });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "USER_UNLOCKED",
      target: user.email,
      details: `Account unlocked. Reason: ${parsedReason.value}`,
      ip,
    });

    try {
      await sendAutomatedEmail(user.email, "accountUnlock", {
        userName: user.name || "User",
      });
    } catch (err) {
      logger.error("Failed to send unlock email", { error: err, email: user.email });
    }

    return NextResponse.json({ message: "Account unlocked successfully" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    logger.error("Failed to unlock account", { error, userId });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
