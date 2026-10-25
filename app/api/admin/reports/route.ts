import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const STATUSES = new Set(["SUCCESS", "FAILED", "PROCESSING"]);
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search")?.trim().slice(0, 120);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25") || 25, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};
    if (status && status !== "All" && STATUSES.has(status)) where.status = status;
    if (userId && OBJECT_ID.test(userId)) where.userId = userId;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    const fromValid = fromDate && !Number.isNaN(fromDate.getTime());
    const toValid = toDate && !Number.isNaN(toDate.getTime());
    if (fromValid || toValid) {
      where.date = {
        ...(fromValid ? { gte: fromDate } : {}),
        ...(toValid ? { lte: toDate } : {}),
      };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { user: { select: { name: true, email: true, avatar: true } } },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({ reports, total, page, limit });
  } catch (error) {
    console.error("[API] Failed to fetch admin reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
