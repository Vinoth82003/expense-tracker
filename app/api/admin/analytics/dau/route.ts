import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";

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
    
    // MAU needs 30 days before the first day of DAU
    const startOfQuery = subDays(startOfDay(startDate), 30);

    const [expenses, incomes, reports, logins] = await Promise.all([
      prisma.expense.findMany({
        where: { createdAt: { gte: startOfQuery, lte: endDate } },
        select: { userId: true, createdAt: true, date: true }
      }),
      prisma.income.findMany({
        where: { createdAt: { gte: startOfQuery, lte: endDate } },
        select: { userId: true, createdAt: true, date: true }
      }),
      prisma.report.findMany({
        where: { date: { gte: startOfQuery, lte: endDate } },
        select: { userId: true, date: true }
      }),
      prisma.loginHistory.findMany({
        where: { createdAt: { gte: startOfQuery, lte: endDate } },
        select: { userId: true, createdAt: true }
      })
    ]);

    const allActivities = [
      ...expenses.map(e => ({ userId: e.userId, time: (e.createdAt || e.date).getTime() })),
      ...incomes.map(i => ({ userId: i.userId, time: (i.createdAt || i.date).getTime() })),
      ...reports.map(r => ({ userId: r.userId, time: r.date.getTime() })),
      ...logins.map(l => ({ userId: l.userId, time: l.createdAt.getTime() }))
    ];

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const data = days.map((day) => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();
      const monthStart = subDays(endOfDay(day), 30).getTime();

      const dailyUsers = new Set();
      const monthlyUsers = new Set();

      for (const act of allActivities) {
        if (act.time >= dayStart && act.time <= dayEnd) {
          dailyUsers.add(act.userId);
        }
        if (act.time >= monthStart && act.time <= dayEnd) {
          monthlyUsers.add(act.userId);
        }
      }

      return {
        date: format(day, "MMM dd"),
        dau: dailyUsers.size,
        mau: monthlyUsers.size,
        ratio: monthlyUsers.size > 0 ? ((dailyUsers.size / monthlyUsers.size) * 100).toFixed(1) : 0
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch DAU/MAU:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
