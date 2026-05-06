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
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "All") where.status = status;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [reports, total] = await Promise.all([
      (prisma as any).report.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, avatar: true }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      (prisma as any).report.count({ where })
    ]);

    return NextResponse.json({ reports, total });
  } catch (error) {
    console.error("Failed to fetch admin reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
