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

    const logs = await prisma.oTPLog.findMany({
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

    // Brute force detection logic
    // If same user/email has 3+ failed OTPs in last 60 min
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedCounts = await prisma.oTPLog.groupBy({
      by: ['email'],
      where: {
        status: 'FAILED',
        createdAt: { gte: hourAgo }
      },
      _count: {
        id: true
      }
    });

    const bruteForceEmails = failedCounts.filter(f => f._count.id >= 3).map(f => f.email);

    const formattedLogs = logs.map(l => ({
      ...l,
      isBruteForce: bruteForceEmails.includes(l.email)
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error("Failed to fetch OTP logs:", error);
    return NextResponse.json({ error: "Failed to fetch OTP logs" }, { status: 500 });
  }
}
