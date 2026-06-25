import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const session = await (prisma as any).userSession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // Get session first to know who it belongs to for the audit log
    const session = await (prisma as any).userSession.findUnique({
      where: { id },
      include: { user: { select: { email: true } } }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await (prisma as any).userSession.delete({
      where: { id }
    });

    // Log the administrative action
    await logAudit({
      adminName: "Admin", // Should be real admin name from session
      adminId: "000000000000000000000000", // Should be real admin ID
      actionType: "SESSION_REVOKED",
      target: session.user.email,
      details: `Revoked session ${id} (${session.browser} on ${session.device})`,
      ip: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Failed to revoke session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
