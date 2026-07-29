import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/internal-api-auth";
import { withErrorNotification } from "@/lib/api-error-handler";
import { checkUserRateLimit } from "@/lib/rateLimit";
import { validateOrigin } from "@/lib/csrf";

// GET - Fetch all income for the logged-in user
export const GET = withErrorNotification(async (request: Request) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); 
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  const whereClause: any = { userId };

  if (fromDate || toDate) {
    whereClause.date = {};
    if (fromDate) whereClause.date.gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      whereClause.date.lte = end;
    }
  } else if (month) {
    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0, 23, 59, 59);
    whereClause.date = { gte: startDate, lte: endDate };
  }

  const incomes = await prisma.income.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ incomes });
}, "GET");

// POST - Create a new income
export const POST = withErrorNotification(async (request: Request) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SECURITY FIX: VULN-020 — CSRF origin validation
  const csrfCheck = validateOrigin(request);
  if (csrfCheck) return csrfCheck;

  // SECURITY FIX: VULN-023 — Rate limit income creation per user
  const rateLimitResult = await checkUserRateLimit(userId, "income-create", 30, 60000);
  if (rateLimitResult) return rateLimitResult;

  const body = await request.json();
  const { amount, source, note, date } = body;

  if (!amount || !source || !date) {
    return NextResponse.json(
      { error: "Missing required fields: amount, source, date" },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const income = await prisma.income.create({
    data: {
      amount: Number(amount),
      source,
      note: note || null,
      date: new Date(date),
      userId,
    } as any,
  });

  return NextResponse.json({ income }, { status: 201 });
}, "POST");
