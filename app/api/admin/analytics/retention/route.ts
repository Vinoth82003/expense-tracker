import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, addWeeks, addMonths, subMonths, format, isAfter } from "date-fns";

export async function GET() {
  if (!(await verifyAdminSession())) {
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
        select: { id: true, createdAt: true }
      });

      const userIds = cohortUsers.map((u: any) => u.id);
      if (userIds.length === 0) continue;

      const getRetentionForDay = async (dayOffset: number) => {
        const results = await Promise.all(cohortUsers.map(async (user: any) => {
          const targetDayStart = new Date(user.createdAt);
          targetDayStart.setDate(targetDayStart.getDate() + dayOffset);
          targetDayStart.setHours(0, 0, 0, 0);
          
          const targetDayEnd = new Date(targetDayStart);
          targetDayEnd.setHours(23, 59, 59, 999);

          if (isAfter(targetDayStart, now)) return null;

          const active = await prisma.pageView.findFirst({
            where: {
              userId: user.id,
              createdAt: { gte: targetDayStart, lte: targetDayEnd }
            }
          });

          return active ? 1 : 0;
        }));

        const filtered = results.filter(r => r !== null);
        if (filtered.length === 0) return null;
        const activeCount = filtered.reduce((acc: number, val: any) => acc + val, 0);
        return ((activeCount / filtered.length) * 100).toFixed(1);
      };

      cohorts.push({
        month: format(monthStart, "MMM"),
        users: userIds.length,
        d1: await getRetentionForDay(1),
        d7: await getRetentionForDay(7),
        d14: await getRetentionForDay(14),
        d30: await getRetentionForDay(30)
      });
    }

    return NextResponse.json(cohorts);
  } catch (error) {
    console.error("Failed to fetch retention:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
