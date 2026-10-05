import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildTransactionWhere,
  FLAGGED_THRESHOLD,
  TRANSACTION_USER_SELECT,
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

    const stats = {
      totalAmount:
        (await prisma.income.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
      recordCount: await prisma.income.count(),
      flaggedCount: await prisma.income.count({
        where: { amount: { gt: FLAGGED_THRESHOLD.income } },
      }),
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
