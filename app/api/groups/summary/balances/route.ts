import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  try {
    // Get all groups where user is a member
    const memberships = await (prisma as any).groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const summaries = await Promise.all(memberships.map(async (membership: any) => {
      // Calculate balance for this user in this group
      const groupId = membership.groupId;
      
      const [totalOwed, totalPaid] = await Promise.all([
        // Total amount this user owes in splits (for unpaid/partial expenses)
        (prisma as any).expenseSplit.aggregate({
          where: {
            userId: user.id,
            groupExpense: { groupId, status: { not: "PAID" } }
          },
          _sum: { amount: true }
        }),
        // Total amount this user has paid for (for unpaid/partial expenses)
        (prisma as any).groupExpense.aggregate({
          where: {
            groupId,
            paidById: user.id,
            status: { not: "PAID" }
          },
          _sum: { amount: true }
        })
      ]);

      const owed = totalOwed._sum.amount || 0;
      const paid = totalPaid._sum.amount || 0;
      const netBalance = owed - paid;

      return {
        groupId,
        groupName: membership.group.name,
        balance: {
          userId: user.id,
          name: user.name,
          email: user.email,
          avatar: user.image,
          totalOwed: owed,
          totalPaid: paid,
          netBalance,
        }
      };
    }));

    // Filter out settled groups if needed, but let's return all active ones
    return NextResponse.json(summaries.filter((s: any) => Math.abs(s.balance.netBalance) > 0.01));
  } catch (error) {
    console.error("Balance summary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
