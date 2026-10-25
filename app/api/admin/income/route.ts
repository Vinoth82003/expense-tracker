import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildTransactionWhere,
  FLAGGED_THRESHOLD,
  TRANSACTION_USER_SELECT,
  validateTransactionDateRange,
} from "@/lib/admin/transactions-filter";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = 25;
    const skip = (page - 1) * limit;

    const rangeError = validateTransactionDateRange(
      searchParams.get("from"),
      searchParams.get("to")
    );
    if (rangeError) {
      return NextResponse.json({ error: rangeError }, { status: 400 });
    }

    const where = buildTransactionWhere(
      {
        userId: searchParams.get("userId"),
        search: searchParams.get("search"),
        // Income rows label their category `source`.
        category: searchParams.get("category"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
        minAmount: searchParams.get("minAmount"),
        maxAmount: searchParams.get("maxAmount"),
        flagged: searchParams.get("flagged") === "true",
      },
      "income"
    ) as Prisma.IncomeWhereInput;

    const [income, total] = await Promise.all([
      prisma.income.findMany({
        where,
        include: { user: { select: { ...TRANSACTION_USER_SELECT } } },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.income.count({ where }),
    ]);

    const formattedIncome = income.map((e) => ({
      ...e,
      isFlagged: e.amount > FLAGGED_THRESHOLD.income,
    }));

    // Growth = this calendar month vs the previous calendar month (UTC), so the
    // comparison period is explicit and reproducible rather than a fixed badge.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

    const [sumAgg, recordCount, flaggedCount, distinctUsers, currentMonthAgg, prevMonthAgg] =
      await Promise.all([
        prisma.income.aggregate({ _sum: { amount: true }, where }),
        prisma.income.count({ where }),
        prisma.income.count({
          where: { ...where, amount: { ...((where.amount as Record<string, unknown>) || {}), gt: FLAGGED_THRESHOLD.income } },
        }),
        prisma.income.findMany({ distinct: ["userId"], where, select: { userId: true } }),
        prisma.income.aggregate({
          _sum: { amount: true },
          where: { ...where, date: { gte: monthStart } },
        }),
        prisma.income.aggregate({
          _sum: { amount: true },
          where: {
            ...where,
            date: { ...((where.date as Record<string, unknown>) || {}), gte: prevMonthStart, lt: monthStart },
          },
        }),
      ]);

    const totalAmount = sumAgg._sum.amount || 0;
    const userCount = distinctUsers.length;
    const currentMonth = currentMonthAgg._sum.amount || 0;
    const previousMonth = prevMonthAgg._sum.amount || 0;

    const stats = {
      totalAmount,
      recordCount,
      flaggedCount,
      userCount,
      // Explicit: reflects the current filter/period, not lifetime.
      avgPerUser: userCount > 0 ? totalAmount / userCount : 0,
      scope: "filtered" as const,
      growth: {
        currentMonth,
        previousMonth,
        // null when there is no baseline to compare against.
        percent:
          previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : null,
        period: "month_over_month" as const,
      },
    };

    return NextResponse.json({
      income: formattedIncome,
      total,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch admin income:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}
