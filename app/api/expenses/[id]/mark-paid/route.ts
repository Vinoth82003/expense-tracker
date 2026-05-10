import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { status } = await req.json();

    if (!["PENDING", "PARTIAL", "PAID"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

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

    // Only creator (payer) can mark as paid
    if (expense.paidById !== user.id) {
      return NextResponse.json({ error: "Forbidden. Only the payer can change payment status." }, { status: 403 });
    }

    const updatedExpense = await (prisma as any).groupExpense.update({
      where: { id },
      data: { status },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        splits: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
