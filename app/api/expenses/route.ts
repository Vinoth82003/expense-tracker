import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/internal-api-auth";

// GET - Fetch all expenses for the logged-in user
export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); 
    const category = searchParams.get("category");
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

    if (category) {
      whereClause.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new expense
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, category, subcategory, note, date } = body;

    if (!amount || !category || !subcategory || !date) {
      return NextResponse.json(
        { error: "Missing required fields: amount, category, subcategory, date" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        category,
        subcategory,
        note: note || null,
        date: new Date(date),
        userId,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
