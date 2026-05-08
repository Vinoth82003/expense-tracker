import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || subDays(new Date(), 30).toISOString();
    const to = searchParams.get("to") || new Date().toISOString();

    const startDate = new Date(from);
    const endDate = new Date(to);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const data = await Promise.all(days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const monthStart = subDays(dayEnd, 30);

      const dau = await prisma.pageView.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      });

      const mau = await prisma.pageView.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: monthStart, lte: dayEnd }
        }
      });

      return {
        date: format(day, "MMM dd"),
        dau: dau.length,
        mau: mau.length,
        ratio: mau.length > 0 ? ((dau.length / mau.length) * 100).toFixed(1) : 0
      };
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch DAU/MAU:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
