import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [income, total] = await Promise.all([
      prisma.income.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatar: true,
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.income.count({ where })
    ]);

    const stats = {
      totalAmount: (await prisma.income.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
      recordCount: await prisma.income.count(),
    };

    return NextResponse.json({
      income,
      total,
      stats
    });
  } catch (error) {
    console.error("Failed to fetch admin income:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}
