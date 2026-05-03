import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { startOfMonth, endOfMonth, addWeeks, addMonths, subMonths, format, isAfter } from "date-fns";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const cohorts = [];
    
    // Last 6 months cohorts
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      
      const cohortUsers = await prisma.user.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        },
        select: { id: true }
      });

      const userIds = cohortUsers.map((u: any) => u.id);
      if (userIds.length === 0) continue;

      const getRetention = async (start: Date, end: Date) => {
        if (isAfter(start, now)) return null;
        const activeUsers = await (prisma as any).loginHistory.groupBy({
          by: ['userId'],
          where: {
            userId: { in: userIds },
            createdAt: { gte: start, lte: end },
            status: "SUCCESS"
          }
        });
        return ((activeUsers.length / userIds.length) * 100).toFixed(1);
      };

      cohorts.push({
        month: format(monthStart, "MMMM yyyy"),
        users: userIds.length,
        week1: await getRetention(addWeeks(monthStart, 1), addWeeks(monthStart, 2)),
        week2: await getRetention(addWeeks(monthStart, 2), addWeeks(monthStart, 3)),
        month1: await getRetention(addMonths(monthStart, 1), addMonths(monthStart, 2)),
        month3: await getRetention(addMonths(monthStart, 3), addMonths(monthStart, 4))
      });
    }

    return NextResponse.json(cohorts);
  } catch (error) {
    console.error("Failed to fetch retention:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
