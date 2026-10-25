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
        category: searchParams.get("category"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
        minAmount: searchParams.get("minAmount"),
        maxAmount: searchParams.get("maxAmount"),
        flagged: searchParams.get("flagged") === "true",
      },
      "expense"
    ) as Prisma.ExpenseWhereInput;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { user: { select: { ...TRANSACTION_USER_SELECT } } },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    // `where` already restricted to the flagged range when requested, so this is
    // a display flag only — no filtering happens after pagination.
    const formattedExpenses = expenses.map((e) => ({
      ...e,
      isFlagged: e.amount > FLAGGED_THRESHOLD.expense,
    }));

    const [sumAgg, recordCount, flaggedCount, distinctUsers] = await Promise.all([
      prisma.expense.aggregate({ _sum: { amount: true }, where }),
      prisma.expense.count({ where }),
      prisma.expense.count({
        where: { ...where, amount: { ...((where.amount as Record<string, unknown>) || {}), gt: FLAGGED_THRESHOLD.expense } },
      }),
      prisma.expense.findMany({ distinct: ["userId"], where, select: { userId: true } }),
    ]);
    const totalAmount = sumAgg._sum.amount || 0;
    const userCount = distinctUsers.length;

    const stats = {
      totalAmount,
      recordCount,
      flaggedCount,
      userCount,
      // Explicit: these totals obey the current filters/period, so they always
      // reconcile with the table below (not a hidden lifetime roll-up).
      avgPerUser: userCount > 0 ? totalAmount / userCount : 0,
      scope: "filtered" as const,
    };

    return NextResponse.json({
      expenses: formattedExpenses,
      total,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch admin expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}
