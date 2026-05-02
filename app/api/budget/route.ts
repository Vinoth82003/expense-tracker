import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const userId = (session.user as any).id;
  const month = req.nextUrl.searchParams.get("month"); // "YYYY-MM"

  if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

  try {
    const exactBudget = await prisma.budget.findUnique({
      where: { userId_month: { userId, month } }
    });

    if (exactBudget) {
      return NextResponse.json({ limit: exactBudget.amount });
    }

    const pastBudgets = await prisma.budget.findMany({
      where: { userId, month: { lt: month } },
      orderBy: { month: "desc" },
      take: 1
    });

    if (pastBudgets.length > 0) {
      return NextResponse.json({ limit: pastBudgets[0].amount });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyLimit: true } });
    return NextResponse.json({ limit: user?.monthlyLimit || 0 });
  } catch (error) {
    console.error("Failed to fetch budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const userId = (session.user as any).id;
  
  try {
    const { month, limit } = await req.json();
    if (!month || limit === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const budget = await prisma.budget.upsert({
      where: { userId_month: { userId, month } },
      update: { amount: Number(limit) },
      create: { userId, month, amount: Number(limit) }
    });

    return NextResponse.json({ success: true, budget });
  } catch (error) {
    console.error("Failed to update budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
