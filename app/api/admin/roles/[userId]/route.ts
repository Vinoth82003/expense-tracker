import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await isAdmin())) {
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
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin",
        adminId: "65f1a2b3c4d5e6f7a8b9c0d1", // Placeholder
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
