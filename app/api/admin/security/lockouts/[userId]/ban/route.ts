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
 * Permanent ban. This is irreversible, so it now requires the same step-up
 * credential + reason as lock/unlock (spec 11) and is written to the audit trail.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized ban attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!OBJECT_ID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsedReason = validateReason(body.reason ?? body.adminReason, { min: 3 });
    if (!parsedReason.ok) {
      return NextResponse.json({ error: parsedReason.error }, { status: 400 });
    }

    if (isStepUpRateLimited(ip)) {
      logger.warn("Step-up rate limit hit on ban", { ip, userId });
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    if (!verifyAdminPassword(body.adminPassword)) {
      registerStepUpFailure(ip);
      logger.error("Invalid admin password for ban", { userId, ip });
      return NextResponse.json({ error: "Invalid administrator password" }, { status: 403 });
    }
    clearStepUpFailures(ip);

    const admin = await getAdminInfo();

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Self-ban guard — an admin must not permanently ban their own account.
    if (admin?.adminId === target.id) {
      return NextResponse.json(
        { error: "Refusing to ban your own admin account." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspensionReason: `Permanent ban: ${parsedReason.value}`,
        isLocked: false,
      },
    });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "USER_BANNED",
      target: target.email,
      details: `Permanent ban applied. Reason: ${parsedReason.value}`,
      ip,
    });

    return NextResponse.json({ message: "Account banned permanently" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    logger.error("Failed to ban account", { error, userId });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
