import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { buildOtpWhere, maskEmail, parseSessionListQuery } from "@/lib/admin/sessions-filter";

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

    const where = buildOtpWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.oTPLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          email: true,
          status: true,
          ip: true,
          attempts: true,
          createdAt: true,
          expiresAt: true,
          user: { select: { name: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.oTPLog.count({ where }),
    ]);

    // Brute-force heuristic: 3+ failures for the same address within the last hour.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedCounts = await prisma.oTPLog.groupBy({
      by: ["email"],
      where: { status: "FAILED", createdAt: { gte: hourAgo } },
      _count: { id: true },
    });
    const bruteForceEmails = new Set(
      failedCounts.filter((f) => f._count.id >= 3).map((f) => f.email)
    );

    // Mask the delivery destination; no OTP code or secret is ever selected.
    const items = rows.map((log) => ({
      ...log,
      email: maskEmail(log.email),
      isBruteForce: bruteForceEmails.has(log.email),
    }));

    return NextResponse.json({ items, total, page: query.page, limit: query.limit });
  } catch (error) {
    logger.error("Failed to fetch OTP logs", { error });
    return NextResponse.json({ error: "Failed to fetch OTP logs" }, { status: 500 });
  }
}
