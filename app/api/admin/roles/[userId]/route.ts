import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const { role, revoke } = await req.json();

    let updateData: any = {};
    if (revoke) {
      updateData = { isAdmin: false, adminRole: "SUPER" };
    } else {
      updateData = { isAdmin: true, adminRole: role || "SUPER" };
    }

    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: updateData
    });

    // Log to audit trail
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    const adminInfo = await getAdminInfo();
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: adminInfo?.adminId || "unknown",
        actionType: "SETTING_CHANGED",
        target: updatedUser.email,
        details: revoke ? "Admin access revoked" : `Admin role set to ${role}`,
        ip
      }
    });

    return NextResponse.json({ message: "Admin role updated successfully" });
  } catch (error) {
    console.error("Failed to update admin role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
