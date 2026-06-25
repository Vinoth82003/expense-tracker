import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || subDays(new Date(), 30).toISOString();
    const to = searchParams.get("to") || new Date().toISOString();

    const startDate = new Date(from);
    const endDate = new Date(to);

    const [expensesCount, incomesCount, reportsCount, loginsCount] = await Promise.all([
      prisma.expense.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.income.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.report.count({ where: { date: { gte: startDate, lte: endDate } } }),
      prisma.loginHistory.count({ where: { createdAt: { gte: startDate, lte: endDate } } })
    ]);

    const activeUsersCount = await prisma.user.count({
      where: { lastActive: { gte: startDate } }
    });

    const data = [
      { feature: "Dashboard (Logins)", count: loginsCount },
      { feature: "Expenses", count: expensesCount },
      { feature: "Income", count: incomesCount },
      { feature: "AI Analysis", count: reportsCount }
    ].map(item => ({
      ...item,
      percent: activeUsersCount > 0 ? ((item.count) / activeUsersCount * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch feature usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
