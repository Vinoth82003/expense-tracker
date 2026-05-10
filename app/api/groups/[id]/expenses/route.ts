import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify group membership
    const member = await (prisma as any).groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expenses = await (prisma as any).groupExpense.findMany({
      where: { groupId: id },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching group expenses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const { description, amount, date, paidById, splits } = body;

    if (!description || !amount || !date || !paidById || !splits || !Array.isArray(splits)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify group membership
    const member = await (prisma as any).groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate total split amount to ensure it matches the expense amount
    // Account for floating point precision issues
    const totalSplitAmount = splits.reduce((sum: number, split: any) => sum + split.amount, 0);
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return NextResponse.json({ error: "Split amounts must equal the total expense amount" }, { status: 400 });
    }

    const newExpense = await (prisma as any).groupExpense.create({
      data: {
        groupId: id,
        description,
        amount,
        date: new Date(date),
        paidById,
        splits: {
          create: splits.map((split: any) => ({
            userId: split.userId,
            amount: split.amount,
            splitType: split.splitType,
            count: split.count,
          })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating group expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
