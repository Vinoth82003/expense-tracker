import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const adminId = searchParams.get("adminId");
    const target = searchParams.get("targetUser");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (action) where.actionType = action;
    if (adminId) where.adminId = adminId;
    if (target) where.target = { contains: target };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const auditLogs = await (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for now
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
