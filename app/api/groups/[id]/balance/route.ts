import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberBalance } from "@/types/group";

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

    const group = await (prisma as any).group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        expenses: {
          where: {
            status: { in: ["PENDING", "PARTIAL"] },
          },
          include: {
            splits: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Verify membership
    const isMember = group.members.some((m: any) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate balances
    const balances: Record<string, MemberBalance> = {};

    // Initialize balances for all members
    group.members.forEach((member: any) => {
      balances[member.userId] = {
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        totalOwed: 0,
        totalPaid: 0,
        netBalance: 0,
        borderColor: "gray",
      };
    });

    // Process expenses
    group.expenses.forEach((expense: any) => {
      const payerId = expense.paidById;

      // The payer has "paid" this amount for the group
      if (balances[payerId]) {
        balances[payerId].totalPaid += expense.amount;
      }

      // The splits represent how much each person "owes" for this expense
      expense.splits.forEach((split: any) => {
        if (balances[split.userId]) {
          balances[split.userId].totalOwed += split.amount;
        }
      });
    });

    let totalGroupExpenses = 0;
    
    // Calculate net balance and border color
    Object.values(balances).forEach((balance) => {
      // Net balance: positive means they owe money (they owe more than they paid)
      // Negative means the group owes them (they paid more than they owe)
      balance.netBalance = balance.totalOwed - balance.totalPaid;

      // Fix floating point precision
      balance.netBalance = Math.round(balance.netBalance * 100) / 100;
      balance.totalOwed = Math.round(balance.totalOwed * 100) / 100;
      balance.totalPaid = Math.round(balance.totalPaid * 100) / 100;

      if (balance.netBalance > 0.01) {
        balance.borderColor = "green"; // Owes money
      } else if (balance.netBalance < -0.01) {
        balance.borderColor = "red"; // Is owed money
      } else {
        balance.borderColor = "gray"; // Settled
        balance.netBalance = 0;
      }
      
      totalGroupExpenses += balance.totalOwed;
    });

    return NextResponse.json({
      groupId: id,
      totalGroupExpenses: Math.round(totalGroupExpenses * 100) / 100,
      memberBalances: Object.values(balances),
    });
  } catch (error) {
    console.error("Error calculating group balance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
