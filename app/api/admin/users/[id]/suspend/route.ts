import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutomatedEmail } from "@/lib/mail";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { reason } = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: !(user as any).isSuspended,
        suspensionReason: !(user as any).isSuspended ? reason : null,
      } as any,
    });

    // Create Audit Log
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const adminInfo = await getAdminInfo();
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: adminInfo?.adminId || "unknown",
        actionType: (updatedUser as any).isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
        target: user.email,
        details: `Reason: ${reason || 'N/A'}`,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      }
    });

    // Log to SystemLog
    await logger.info(`User ${user.email} ${(updatedUser as any).isSuspended ? 'suspended' : 'activated'} by Admin`, {
      userId: user.id,
      reason,
      action: (updatedUser as any).isSuspended ? "SUSPEND" : "ACTIVATE"
    });
    
    // 3. Send Email
    if ((updatedUser as any).isSuspended) {
      await sendAutomatedEmail(user.email, "accountSuspension", {
        userName: user.name || "User",
        reason: reason || "Violation of terms"
      });
    } else {
      await sendAutomatedEmail(user.email, "accountReactivation", {
        userName: user.name || "User"
      });
    }

    return NextResponse.json({ 
      message: `User ${(updatedUser as any).isSuspended ? 'suspended' : 'activated'} successfully`,
      isSuspended: (updatedUser as any).isSuspended 
    });
  } catch (error) {
    console.error("Failed to update user suspension:", error);
    return NextResponse.json({ error: "Failed to update user suspension" }, { status: 500 });
  }
}
