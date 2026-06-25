import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            expenses: true,
            incomes: true,
            reports: true,
          },
        },
        expenses: {
          take: 0, // We just need the count, but we can aggregate for total
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Aggregates for totals
    const [expenseSum, incomeSum, budgetHistory] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId: id },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { userId: id },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId: id },
        take: 6,
        orderBy: { month: 'desc' },
      })
    ]);

    return NextResponse.json({
      ...user,
      stats: {
        expenseTotal: expenseSum._sum.amount || 0,
        incomeTotal: incomeSum._sum.amount || 0,
        budgetHistory
      }
    });
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
