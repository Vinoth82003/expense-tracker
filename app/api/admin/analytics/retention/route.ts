import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

/**
 * Signup-cohort retention.
 *
 * Cohorts are calendar months in UTC (matching how createdAt is stored), so the
 * user count is reproducible regardless of the server's local timezone — this is
 * what previously made a cohort show 14 users against 16 registered.
 *
 * A retention cell is only meaningful once the whole window has elapsed. For an
 * immature window (the cohort has not aged D7 yet, say) the cell is returned as
 * `pending: true` with a null value, so the UI can show "Pending" rather than a
 * misleading 0%.
 */
const MONTHS = 6;

function utcMonthStart(base: Date, monthsBack: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - monthsBack, 1));
}

function utcMonthEnd(base: Date, monthsBack: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - monthsBack + 1, 0, 23, 59, 59, 999));
}

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const nowMs = now.getTime();
    const cohorts: Array<{
      month: string;
      users: number;
      d1: { value: number | null; pending: boolean };
      d7: { value: number | null; pending: boolean };
      d14: { value: number | null; pending: boolean };
      d30: { value: number | null; pending: boolean };
    }> = [];

    for (let i = MONTHS - 1; i >= 0; i--) {
      const monthStart = utcMonthStart(now, i);
      const monthEnd = utcMonthEnd(now, i);

      const cohortUsers = await prisma.user.findMany({
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
        select: { id: true, createdAt: true },
      });

      if (cohortUsers.length === 0) continue;

      const retentionForDay = async (
        dayOffset: number
      ): Promise<{ value: number | null; pending: boolean }> => {
        const activeFlags: Array<number | null> = await Promise.all(
          cohortUsers.map(async (user): Promise<number | null> => {
            if (!user.createdAt) return null;
            const targetDayStart = new Date(user.createdAt);
            targetDayStart.setUTCDate(targetDayStart.getUTCDate() + dayOffset);
            targetDayStart.setUTCHours(0, 0, 0, 0);

            // Window not fully elapsed yet → immature, not a real 0%.
            if (targetDayStart.getTime() > nowMs) return null;

            const targetDayEnd = new Date(targetDayStart);
            targetDayEnd.setUTCHours(23, 59, 59, 999);

            const active = await prisma.pageView.findFirst({
              where: { userId: user.id, createdAt: { gte: targetDayStart, lte: targetDayEnd } },
              select: { id: true },
            });
            return active ? 1 : 0;
          })
        );

        const definable = activeFlags.filter((v): v is number => v !== null);
        if (definable.length === 0) return { value: null, pending: true };

        const activeCount = definable.reduce((acc, v) => acc + v, 0);
        return {
          value: Number(((activeCount / definable.length) * 100).toFixed(1)),
          pending: false,
        };
      };

      cohorts.push({
        month: format(monthStart, "MMM"),
        users: cohortUsers.length,
        d1: await retentionForDay(1),
        d7: await retentionForDay(7),
        d14: await retentionForDay(14),
        d30: await retentionForDay(30),
      });
    }

    return NextResponse.json(cohorts);
  } catch (error) {
    console.error("Failed to fetch retention:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
