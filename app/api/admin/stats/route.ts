import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalUsers = await prisma.user.count();
    
    // Calculate total expenses safely
    const expensesAggregation = await prisma.expense.aggregate({
      _sum: { amount: true }
    });
    const totalExpenses = expensesAggregation._sum.amount || 0;

    // Calculate total income safely
    const incomeAggregation = await prisma.income.aggregate({
      _sum: { amount: true }
    });
    const totalIncome = incomeAggregation._sum.amount || 0;

    // Fetch recent 5 combined activities (we'll fetch 5 recent expenses/incomes separately and zip them)
    const recentExpenses = await prisma.expense.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    const recentIncomes = await prisma.income.findMany({
      take: 2,
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    // Format recent activity log
    const recentActivity = [
      ...recentExpenses.map(e => ({
        user: e.user?.name || e.user?.email || "Unknown User",
        action: `Logged a ${e.category} expense`,
        amount: `₹${e.amount.toLocaleString()}`,
        time: e.date,
        type: "expense"
      })),
      ...recentIncomes.map(i => ({
        user: i.user?.name || i.user?.email || "Unknown User",
        action: `Received ${i.source} income`,
        amount: `+₹${i.amount.toLocaleString()}`,
        time: i.date,
        type: "income"
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Calculate a naive avg savings rate for demonstration based on system totals (in real app, this would be per user or historical DB cache)
    const avgSavings = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    return NextResponse.json({
      totalUsers,
      totalExpenses,
      totalIncome,
      avgSavings,
      recentActivity
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
