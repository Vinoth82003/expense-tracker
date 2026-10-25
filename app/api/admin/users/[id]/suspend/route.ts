import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized suspension change attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    const admin = await getAdminInfo();

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, isSuspended: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Self-suspend guard.
    if (admin?.adminId === user.id) {
      return NextResponse.json(
        { error: "Refusing to change the suspension state of your own admin account." },
        { status: 400 }
      );
    }

    const willSuspend = !user.isSuspended;

    // Suspending is a punitive, user-visible action — require a reason.
    if (willSuspend) {
      const parsedReason = validateReason(reason, { min: 3 });
      if (!parsedReason.ok) {
        return NextResponse.json({ error: parsedReason.error }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: willSuspend,
        suspensionReason: willSuspend ? reason : null,
      },
      select: { isSuspended: true },
    });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: updatedUser.isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
      target: user.email,
      details: updatedUser.isSuspended ? `Reason: ${reason}` : "Account reactivated.",
      ip,
    });

    logger.info(`User ${user.email} ${updatedUser.isSuspended ? "suspended" : "activated"} by admin`, {
      userId: user.id,
      reason: reason || undefined,
      action: updatedUser.isSuspended ? "SUSPEND" : "ACTIVATE",
    });

    try {
      if (updatedUser.isSuspended) {
        await sendAutomatedEmail(user.email, "accountSuspension", {
          userName: user.name || "User",
          reason: reason || "Violation of terms",
        });
      } else {
        await sendAutomatedEmail(user.email, "accountReactivation", {
          userName: user.name || "User",
        });
      }
    } catch (err) {
      logger.error("Failed to send suspension email", { error: err, email: user.email });
    }

    return NextResponse.json({
      message: `User ${updatedUser.isSuspended ? "suspended" : "activated"} successfully`,
      isSuspended: updatedUser.isSuspended,
    });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    logger.error("Failed to update user suspension", { error, userId: id });
    return NextResponse.json({ error: "Failed to update user suspension" }, { status: 500 });
  }
}
