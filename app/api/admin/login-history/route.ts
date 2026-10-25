import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { buildLoginWhere, parseSessionListQuery } from "@/lib/admin/sessions-filter";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = parseSessionListQuery(searchParams);
    if (query.dateInvalid) {
      return NextResponse.json({ error: "Invalid date filter." }, { status: 400 });
    }

    const where = buildLoginWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        select: {
          id: true,
          userId: true,
          method: true,
          status: true,
          ip: true,
          device: true,
          browser: true,
          createdAt: true,
          user: { select: { name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.loginHistory.count({ where }),
    ]);

    return NextResponse.json({ items, total, page: query.page, limit: query.limit });
  } catch (error) {
    logger.error("Failed to fetch login history", { error });
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 });
  }
}
