import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || 'expense';

    let transaction;
    if (type === 'expense') {
      transaction = await prisma.expense.findUnique({ where: { id } });
    } else {
      transaction = await prisma.income.findUnique({ where: { id } });
    }

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const userId = transaction.userId;
    const month = new Date(transaction.date).toISOString().slice(0, 7);

    // Get monthly budget context
    const budget = await prisma.budget.findFirst({
      where: { userId, month }
    });

    // Get category average across all users
    let categoryAvg = 0;
    if (type === 'expense') {
      const agg = await prisma.expense.aggregate({
        where: { category: (transaction as any).category },
        _avg: { amount: true }
      });
      categoryAvg = agg._avg.amount || 0;
    }

    return NextResponse.json({
      budgetPercentage: budget ? (transaction.amount / budget.amount) * 100 : null,
      categoryAverage: categoryAvg,
      userMonthlyTotal: type === 'expense' ? 
        (await prisma.expense.aggregate({ where: { userId, date: { gte: new Date(month + "-01") } }, _sum: { amount: true } }))._sum.amount : 
        (await prisma.income.aggregate({ where: { userId, date: { gte: new Date(month + "-01") } }, _sum: { amount: true } }))._sum.amount
    });
  } catch (error) {
    console.error("Failed to fetch transaction context:", error);
    return NextResponse.json({ error: "Failed to fetch context" }, { status: 500 });
  }
}
