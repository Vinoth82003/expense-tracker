import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  buildSessionWhere,
  deriveSessionStatus,
  parseSessionListQuery,
} from "@/lib/admin/sessions-filter";

/**
 * Session records here are informational only.
 *
 * The app authenticates with signed JWTs (`lib/auth.ts` uses
 * `strategy: "jwt"` and no DB adapter), so an individual session cannot be
 * invalidated server-side — deleting a `UserSession` row would not sign anyone
 * out. Access is revoked by LOCKING THE ACCOUNT (Security -> Lockouts), which
 * is the documented path. This route is therefore read-only.
 */
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

    const where = buildSessionWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.userSession.findMany({
        where,
        select: {
          id: true,
          userId: true,
          device: true,
          browser: true,
          ip: true,
          location: true,
          expires: true,
          createdAt: true,
          user: { select: { name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.userSession.count({ where }),
    ]);

    const now = new Date();
    const items = rows.map((s) => ({
      ...s,
      // Distinguish active vs expired rather than implying every row is live.
      status: deriveSessionStatus(s.expires, now),
      // Location is derived from IP and therefore approximate only.
      isApproxLocation: s.location !== null,
      isSuspicious: s.location === "Unknown" || s.ip.startsWith("10."),
    }));

    return NextResponse.json({ items, total, page: query.page, limit: query.limit });
  } catch (error) {
    logger.error("Failed to fetch active sessions", { error });
    return NextResponse.json({ error: "Failed to fetch active sessions" }, { status: 500 });
  }
}
