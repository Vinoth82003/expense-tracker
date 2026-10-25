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
 * Force-disable a user's 2FA. Sensitive, so it now requires the same step-up
 * credential + reason as the security page's 2FA override, refuses self-target,
 * and is audited (spec 02/11).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized 2FA reset attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsedReason = validateReason(body.reason, { min: 3 });
    if (!parsedReason.ok) {
      return NextResponse.json({ error: parsedReason.error }, { status: 400 });
    }

    if (isStepUpRateLimited(ip)) {
      logger.warn("Step-up rate limit hit on 2FA reset", { ip, userId: id });
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    if (!verifyAdminPassword(body.adminPassword)) {
      registerStepUpFailure(ip);
      logger.error("Invalid admin password for 2FA reset", { userId: id, ip });
      return NextResponse.json({ error: "Invalid administrator password" }, { status: 403 });
    }
    clearStepUpFailures(ip);

    const admin = await getAdminInfo();

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Self-target guard — an admin must not disable their own 2FA here.
    if (admin?.adminId === existing.id) {
      return NextResponse.json(
        { error: "Refusing to reset 2FA on your own admin account." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorOTP: null,
        twoFactorOTPExpires: null,
      },
    });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "2FA_RESET",
      target: existing.email,
      details: `2FA reset. Reason: ${parsedReason.value}`,
      ip,
    });

    try {
      await sendAutomatedEmail(existing.email, "twoFactorOverride", {
        userName: existing.name || "User",
        reason: parsedReason.value,
      });
    } catch (err) {
      logger.error("Failed to send 2FA reset email", { error: err, email: existing.email });
    }

    return NextResponse.json({ message: "2FA reset successfully" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    logger.error("Failed to reset 2FA", { error, userId: id });
    return NextResponse.json({ error: "Failed to reset 2FA" }, { status: 500 });
  }
}
