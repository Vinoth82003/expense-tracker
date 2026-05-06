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
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
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
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin", // Should be fetched from session in real app
        adminId: "000000000000000000000000", // Placeholder if no admin ID is in session
        actionType: (updatedUser as any).isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
        target: user.email,
        details: `Reason: ${reason || 'N/A'}`,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      }
    });

    return NextResponse.json({ 
      message: `User ${(updatedUser as any).isSuspended ? 'suspended' : 'activated'} successfully`,
      isSuspended: (updatedUser as any).isSuspended 
    });
  } catch (error) {
    console.error("Failed to update user suspension:", error);
    return NextResponse.json({ error: "Failed to update user suspension" }, { status: 500 });
  }
}
