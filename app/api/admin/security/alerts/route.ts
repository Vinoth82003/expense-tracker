import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_ALERTS = 200;

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerts = await prisma.securityAlert.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_ALERTS,
    });

    const withProvenance = alerts.map((entry) => ({
      ...entry,
      source: entry.source ?? null,
      // First seen is the creation time; last seen may be unset on legacy rows.
      firstSeenAt: entry.createdAt,
      lastSeenAt: entry.lastSeenAt ?? entry.createdAt,
      resolvedAt: entry.resolvedAt ?? null,
      resolvedBy: entry.resolvedBy ?? null,
    }));

    return NextResponse.json(withProvenance);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
