import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endOfDay, subDays, eachDayOfInterval, format } from "date-fns";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
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
      const dayEnd = endOfDay(day);

      const totalUsers = await prisma.user.count({
        where: {
          createdAt: { lte: dayEnd }
        }
      });

      return {
        date: format(day, "MMM dd"),
        users: totalUsers
      };
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch growth metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
