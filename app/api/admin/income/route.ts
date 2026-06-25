import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category"); // 'source' in income
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const flagged = searchParams.get("flagged") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (category && category !== "All") where.source = category;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    const [income, total] = await Promise.all([
      prisma.income.findMany({
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
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.income.count({ where })
    ]);

    const formattedIncome = income.map(e => ({
      ...e,
      isFlagged: e.amount > 50000, 
    }));

    const finalIncome = flagged ? formattedIncome.filter(e => e.isFlagged) : formattedIncome;

    const stats = {
      totalAmount: (await prisma.income.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
      recordCount: await prisma.income.count(),
      flaggedCount: await prisma.income.count({ where: { amount: { gt: 50000 } } }),
    };

    return NextResponse.json({
      income: finalIncome,
      total,
      stats
    });
  } catch (error) {
    console.error("Failed to fetch admin income:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}
