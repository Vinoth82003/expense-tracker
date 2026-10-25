import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildReviewWhere, parseReviewListQuery } from "@/lib/admin/reviews-filter";

export async function GET(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = parseReviewListQuery(searchParams);
    const where = buildReviewWhere(query);

    const [items, total, totalAll, approvedAgg, pending, rejected] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          createdAt: true,
          moderationReason: true,
          moderatedAt: true,
          moderatedBy: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.count(),
      prisma.review.aggregate({
        where: { status: "APPROVED" },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { status: "REJECTED" } }),
    ]);

    const approved = approvedAgg._count?._all ?? 0;
    return NextResponse.json(
      {
        items,
        total,
        page: query.page,
        limit: query.limit,
        stats: {
          total: totalAll,
          pending,
          approved,
          rejected,
          updatedReviewCount: totalAll - (pending + rejected), // = approved (kept explicit for reconcile)
          averageRating: approvedAgg._avg?.rating ?? null,
          averageBasis: "approved" as const,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reviews list error:", error);
    return NextResponse.json({ message: "Failed to fetch reviews" }, { status: 500 });
  }
}
