import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalReports,
      reportsToday,
      reportsMonth,
      tokensToday,
      unknownMetadata,
    ] = await Promise.all([
      // All-time count â€” this is the number the overview page shows. The reports
      // page previously displayed only the current-month count, so when the
      // dataset predated the month it read "0" while ~21 rows were listed.
      prisma.report.count(),
      prisma.report.count({
        where: { date: { gte: todayStart } }
      }),
      prisma.report.count({
        where: { date: { gte: monthStart } }
      }),
      prisma.report.aggregate({
        where: { date: { gte: todayStart } },
        _sum: { tokens: true, cost: true }
      }),
      // Rows whose provider metadata is missing. A null token/cost is "unknown",
      // not a true zero, so the UI must not render it as 0.
      prisma.report.count({
        where: { OR: [{ tokens: null }, { cost: null }] }
      }),
    ]);

    // Chart data: last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayStats = await prisma.report.aggregate({
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

    const rateLimit = await prisma.settings.findUnique({ where: { key: 'maxReportsPerDay' } });

    return NextResponse.json({
      stats: {
        totalReports,
        reportsToday,
        reportsMonth,
        tokensToday: tokensToday._sum.tokens || 0,
        costToday: tokensToday._sum.cost || 0,
        unknownMetadata,
        rateLimit: rateLimit ? parseInt(rateLimit.value) : 3,
      },
      chartData
    });
  } catch (error) {
    console.error("Failed to fetch report stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
