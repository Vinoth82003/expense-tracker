import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all income for the logged-in user
export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); 
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const whereClause: any = { userId: user.id };

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
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new income
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const income = await prisma.income.create({
      data: {
        amount: Number(amount),
        source,
        note: note || null,
        date: new Date(date),
        userId: user.id, 
      } as any,
    });

    return NextResponse.json({ income }, { status: 201 });
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
