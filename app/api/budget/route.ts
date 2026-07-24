import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/internal-api-auth";
import { withErrorNotification } from "@/lib/api-error-handler";

export const GET = withErrorNotification(async (req: NextRequest) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const month = req.nextUrl.searchParams.get("month"); // "YYYY-MM"

  if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

  const exactBudget = await prisma.budget.findUnique({
    where: { userId_month: { userId, month } }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyLimit: true, expenseMode: true }
  });

  if (exactBudget) {
    return NextResponse.json({ limit: exactBudget.amount, expenseMode: user?.expenseMode || "no-limit" });
  }

  const pastBudgets = await prisma.budget.findMany({
    where: { userId, month: { lt: month } },
    orderBy: { month: "desc" },
    take: 1
  });

  if (pastBudgets.length > 0) {
    return NextResponse.json({ limit: pastBudgets[0].amount, expenseMode: user?.expenseMode || "no-limit" });
  }

  return NextResponse.json({ limit: user?.monthlyLimit || 0, expenseMode: user?.expenseMode || "no-limit" });
}, "GET");

export const POST = withErrorNotification(async (req: NextRequest) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { month, limit } = await req.json();
  if (!month || limit === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const numericLimit = Number(limit);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return NextResponse.json({ error: "Limit must be a positive number" }, { status: 400 });
  }

  const [budget] = await prisma.$transaction([
    prisma.budget.upsert({
      where: { userId_month: { userId, month } },
      update: { amount: numericLimit },
      create: { userId, month, amount: numericLimit }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { expenseMode: "limit", monthlyLimit: numericLimit }
    })
  ]);

  return NextResponse.json({ success: true, budget });
}, "POST");
