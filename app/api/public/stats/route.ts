import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalExpenses, reviewAgg] = await Promise.all([
      prisma.user.count(),
      prisma.expense.count(),
      prisma.review.aggregate({
        where: { status: "APPROVED" },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const avgRating = reviewAgg._avg.rating
      ? Number(reviewAgg._avg.rating.toFixed(1))
      : null;
    const ratingCount = reviewAgg._count.rating;

    return NextResponse.json(
      { totalUsers, totalExpenses, avgRating, ratingCount },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch (error) {
    console.error("Public stats error:", error);
    return NextResponse.json(
      { totalUsers: 0, totalExpenses: 0, avgRating: null, ratingCount: 0 },
      { status: 200 }
    );
  }
}
