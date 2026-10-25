import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { describeNotificationStatus } from "@/lib/email-jobs";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count()
    ]);

    // Open/click tallies for this page's campaigns, from EmailLog. One groupBy
    // instead of a query per row — the page shows 20 campaigns at a time.
    const ids = history.map((h) => h.id);
    const openCounts: Record<string, { opened: number; clicked: number; logged: number }> = {};
    if (ids.length > 0) {
      const [openedGroups, clickedGroups, loggedGroups] = await Promise.all([
        prisma.emailLog.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: ids }, opened: true },
          _count: { _all: true },
        }),
        prisma.emailLog.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: ids }, clicked: true },
          _count: { _all: true },
        }),
        prisma.emailLog.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: ids } },
          _count: { _all: true },
        }),
      ]);
      const bump = (
        groups: { campaignId: string | null; _count: { _all: number } }[],
        key: "opened" | "clicked" | "logged"
      ) => {
        for (const g of groups) {
          if (!g.campaignId) continue;
          openCounts[g.campaignId] = openCounts[g.campaignId] || {
            opened: 0,
            clicked: 0,
            logged: 0,
          };
          openCounts[g.campaignId][key] = g._count._all;
        }
      };
      bump(openedGroups, "opened");
      bump(clickedGroups, "clicked");
      bump(loggedGroups, "logged");
    }

    const enriched = history.map((h) => {
      const lifecycle = describeNotificationStatus(h.status, {
        deliveryConfirmed: h.deliveryConfirmed ?? false,
        attempts: h.attempts ?? 1,
      });
      return {
        ...h,
        // Legacy rows have no correlationId column value; their id is the job id.
        correlationId: h.correlationId ?? h.id,
        attempts: h.attempts ?? 1,
        deliveredCount: h.deliveredCount ?? null,
        failedCount: h.failedCount ?? null,
        deliveryConfirmed: h.deliveryConfirmed ?? false,
        lifecycle: lifecycle.key,
        lifecycleLabel: lifecycle.label,
        lifecycleTone: lifecycle.tone,
        lifecycleDescription: lifecycle.description,
        stats: openCounts[h.id] || { opened: 0, clicked: 0, logged: 0 },
      };
    });

    return NextResponse.json({ history: enriched, total });
  } catch (error) {
    console.error("Failed to fetch notification history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
