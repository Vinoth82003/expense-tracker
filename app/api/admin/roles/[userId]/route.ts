import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["SUPER"] as const;
type AdminRole = (typeof ALLOWED_ROLES)[number];

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

    if (typeof userId !== "string" || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // Mass-assignment guard: only known roles may be granted.
    if (!revoke && !ALLOWED_ROLES.includes(role as AdminRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const target = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isAdmin: true, adminRole: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const adminInfo = await getAdminInfo();

    // A caller must not change their own admin role (no self-grant / self-revoke).
    if (adminInfo && adminInfo.adminId === target.id) {
      return NextResponse.json(
        { error: "Refusing to change your own admin role." },
        { status: 400 }
      );
    }

    const wasSuper = target.isAdmin && target.adminRole === "SUPER";
    const willRemainSuper = !revoke; // target keeps a SUPER-equivalent grant

    // Never allow the platform to lose its last super admin.
    if (wasSuper && !willRemainSuper) {
      const superCount = await (prisma as any).user.count({
        where: { isAdmin: true, adminRole: "SUPER" },
      });
      if (superCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last super admin." },
          { status: 409 }
        );
      }
    }

    const updateData = revoke
      ? { isAdmin: false, adminRole: "SUPER" }
      : { isAdmin: true, adminRole: role || "SUPER" };

    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: updateData
    });

    // Log to audit trail
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    const safeAdminId = (adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId))
      ? adminInfo.adminId
      : "000000000000000000000000";
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: safeAdminId,
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
