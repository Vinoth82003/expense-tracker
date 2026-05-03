import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const reportsToday = await (prisma as any).report.count({
      where: { date: { gte: todayStart } }
    });

    const reportsMonth = await (prisma as any).report.count({
      where: { date: { gte: monthStart } }
    });

    const tokensToday = await (prisma as any).report.aggregate({
      where: { date: { gte: todayStart } },
      _sum: { tokens: true, cost: true }
    });

    // Chart data: last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayStats = await (prisma as any).report.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { tokens: true, cost: true }
      });

      chartData.push({
        date: start.toISOString().split('T')[0],
        tokens: dayStats._sum.tokens || 0,
        cost: dayStats._sum.cost || 0,
        quota: 3500000 // Fixed quota for visualization
      });
    }

    const rateLimit = await (prisma as any).settings.findUnique({ where: { key: 'maxReportsPerDay' } });

    return NextResponse.json({
      stats: {
        reportsToday,
        reportsMonth,
        tokensToday: tokensToday._sum.tokens || 0,
        costToday: tokensToday._sum.cost || 0,
        rateLimit: rateLimit ? parseInt(rateLimit.value) : 3,
      },
      chartData
    });
  } catch (error) {
    console.error("Failed to fetch report stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
