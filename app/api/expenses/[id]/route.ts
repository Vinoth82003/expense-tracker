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

    const expense = await (prisma as any).groupExpense.findUnique({
      where: { id },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        group: { select: { members: true } },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Verify group membership
    const isMember = expense.group.members.some((m: any) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
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
    const { description, amount, date, splits } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const expense = await (prisma as any).groupExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Only creator (payer) can edit
    if (expense.paidById !== user.id) {
      return NextResponse.json({ error: "Forbidden. Only the payer can edit this expense." }, { status: 403 });
    }

    if (splits) {
      const totalSplitAmount = splits.reduce((sum: number, split: any) => sum + split.amount, 0);
      if (Math.abs(totalSplitAmount - (amount || expense.amount)) > 0.01) {
        return NextResponse.json({ error: "Split amounts must equal the total expense amount" }, { status: 400 });
      }
    }

    // Use a transaction if splits are being updated to delete old and create new
    const updateData: any = {
      description,
      amount,
      ...(date && { date: new Date(date) }),
    };

    if (splits) {
      await (prisma as any).$transaction([
        (prisma as any).expenseSplit.deleteMany({ where: { groupExpenseId: id } }),
        (prisma as any).groupExpense.update({
          where: { id },
          data: {
            ...updateData,
            splits: {
              create: splits.map((split: any) => ({
                userId: split.userId,
                amount: split.amount,
                splitType: split.splitType,
                count: split.count,
              })),
            },
          },
        }),
      ]);
    } else {
      await (prisma as any).groupExpense.update({
        where: { id },
        data: updateData,
      });
    }

    const updatedExpense = await (prisma as any).groupExpense.findUnique({
      where: { id },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        splits: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const expense = await (prisma as any).groupExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Only creator (payer) can delete
    if (expense.paidById !== user.id) {
      return NextResponse.json({ error: "Forbidden. Only the payer can delete this expense." }, { status: 403 });
    }

    await (prisma as any).groupExpense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
