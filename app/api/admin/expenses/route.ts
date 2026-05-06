import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");
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
    if (category && category !== "All") where.category = category;
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

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
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
      prisma.expense.count({ where })
    ]);

    const formattedExpenses = expenses.map(e => ({
      ...e,
      isFlagged: e.amount > 10000, 
    }));

    // If flagged=true filter was requested, filter them
    const finalExpenses = flagged ? formattedExpenses.filter(e => e.isFlagged) : formattedExpenses;

    const stats = {
      totalAmount: (await prisma.expense.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
      recordCount: await prisma.expense.count(),
      flaggedCount: await prisma.expense.count({ where: { amount: { gt: 10000 } } }),
    };

    return NextResponse.json({
      expenses: finalExpenses,
      total,
      stats
    });
  } catch (error) {
    console.error("Failed to fetch admin expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}
