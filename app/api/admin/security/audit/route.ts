import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

function parseDateParam(value: string | null): Date | "invalid" | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const adminId = searchParams.get("adminId");
    const target = searchParams.get("targetUser");
    const from = parseDateParam(searchParams.get("from"));
    const to = parseDateParam(searchParams.get("to"));

    if (from === "invalid" || to === "invalid") {
      return NextResponse.json({ error: "Invalid date filter." }, { status: 400 });
    }

    const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const where: Prisma.AuditLogWhereInput = {};
    if (action) where.actionType = action;
    if (adminId && OBJECT_ID_RE.test(adminId)) where.adminId = adminId;
    if (target) where.target = { contains: target };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
