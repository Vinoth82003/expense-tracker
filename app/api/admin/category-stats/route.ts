import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: { id: true },
    });

    const formattedStats = stats.map(s => ({
      name: s.category,
      volume: s._sum.amount || 0,
      count: s._count.id,
    })).sort((a, b) => b.volume - a.volume).slice(0, 10);

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error("Failed to fetch category stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
