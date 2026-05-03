import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { subDays } from "date-fns";

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

    const featureUsage = await (prisma as any).pageView.groupBy({
      by: ['page'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const activeUsersCount = await prisma.user.count({
      where: {
        lastActive: { gte: startDate }
      }
    });

    // Features we want to track specifically
    const features = ["Dashboard", "Expenses", "AI Analysis", "Reports", "Income", "Categories", "Settings", "Profile"];
    
    const data = features.map(f => {
      const usage = featureUsage.find((u: any) => u.page === f);
      const count = usage ? (usage as any)._count.id : 0;
      return {
        feature: f,
        count: count,
        percent: activeUsersCount > 0 ? ((count as number) / activeUsersCount * 100).toFixed(1) : 0
      };
    }).sort((a, b) => (b.count as number) - (a.count as number));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch feature usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
