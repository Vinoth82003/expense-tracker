import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (status && status !== "All") where.status = status;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const history = await (prisma as any).loginHistory.findMany({
      where,
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

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch login history:", error);
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 });
  }
}
