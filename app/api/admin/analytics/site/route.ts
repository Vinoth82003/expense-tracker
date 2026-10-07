import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from "date-fns";

// Aggregates for the first-party marketing-site pageview collection.
// Everything here is anonymous data — no users, no IPs.
export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const rangeDays = Math.min(Math.max(parseInt(searchParams.get("range") || "30", 10) || 30, 1), 365);

    const start = startOfDay(subDays(new Date(), rangeDays - 1));
    const end = endOfDay(new Date());

    const rows = await prisma.sitePageView.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { path: true, referrer: true, country: true, sessionId: true, createdAt: true },
    });

    const days = eachDayOfInterval({ start, end });
    const dayKeys = days.map((d) => format(d, "yyyy-MM-dd"));
    const viewsByDay: Record<string, number> = {};
    for (const key of dayKeys) viewsByDay[key] = 0;

    const viewsByPath = new Map<string, number>();
    const viewsByReferrer = new Map<string, number>();
    const viewsByCountry = new Map<string, number>();
    const sessions = new Set<string>();
    let referrerKnown = 0;

    for (const row of rows) {
      const key = format(row.createdAt, "yyyy-MM-dd");
      if (key in viewsByDay) viewsByDay[key] += 1;

      const path = row.path || "/";
      viewsByPath.set(path, (viewsByPath.get(path) || 0) + 1);

      if (row.sessionId) sessions.add(row.sessionId);

      if (row.referrer) {
        referrerKnown += 1;
        let source = row.referrer;
        try {
          // Collapse to registrable host so ga/utm noise doesn't fragment.
          source = new URL(row.referrer).host;
        } catch {
          /* keep raw */
        }
        viewsByReferrer.set(source, (viewsByReferrer.get(source) || 0) + 1);
      }

      if (row.country) {
        viewsByCountry.set(row.country, (viewsByCountry.get(row.country) || 0) + 1);
      }
    }

    const top = (map: Map<string, number>, limit: number) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([key, count]) => ({ key, count }));

    return NextResponse.json({
      range: rangeDays,
      totals: {
        views: rows.length,
        uniqueSessions: sessions.size,
        directShare:
          rows.length > 0
            ? Math.round(((rows.length - referrerKnown) / rows.length) * 100)
            : 0,
      },
      daily: dayKeys.map((key) => ({
        date: format(new Date(`${key}T00:00:00`), "MMM dd"),
        views: viewsByDay[key],
      })),
      topPaths: top(viewsByPath, 15),
      topReferrers: top(viewsByReferrer, 10),
      topCountries: top(viewsByCountry, 10),
    });
  } catch (error) {
    console.error("Failed to fetch site analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
