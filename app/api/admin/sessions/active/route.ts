import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await prisma.userSession.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSessions = sessions.map((s) => ({
      ...s,
      isSuspicious: s.location === "Unknown" || s.ip.startsWith("10."),
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Failed to fetch active sessions:", error);
    return NextResponse.json({ error: "Failed to fetch active sessions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";

    const adminInfo = {
      adminName: "Admin",
      adminId: "000000000000000000000000",
      ip: req.headers.get("x-forwarded-for") || "unknown"
    };

    if (all) {
      await prisma.userSession.deleteMany({});
      await logAudit({
        ...adminInfo,
        actionType: "SESSIONS_REVOKED_ALL",
        target: "ALL_USERS",
        details: "Revoked all active sessions across the platform"
      });
      return NextResponse.json({ message: "All sessions revoked" });
    }

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      await prisma.userSession.deleteMany({ where: { userId } });
      await logAudit({
        ...adminInfo,
        actionType: "SESSIONS_REVOKED_USER",
        target: user?.email || userId,
        details: `Revoked all sessions for user ${userId}`
      });
      return NextResponse.json({ message: `All sessions for user ${userId} revoked` });
    }

    if (id) {
      const session = await prisma.userSession.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
      if (session) {
        await prisma.userSession.delete({ where: { id } });
        await logAudit({
          ...adminInfo,
          actionType: "SESSION_REVOKED",
          target: session.user.email,
          details: `Revoked session ${id} (${session.browser} on ${session.device})`
        });
      }
      return NextResponse.json({ message: "Session revoked" });
    }

    return NextResponse.json({ error: "ID or UserId is required" }, { status: 400 });
  } catch (error) {
    console.error("Failed to revoke session:", error);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}
