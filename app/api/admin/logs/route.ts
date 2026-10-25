import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { redactDetails } from "@/lib/admin/log-redaction";
import type { Prisma } from "@prisma/client";

const LEVELS = new Set(["INFO", "WARN", "ERROR", "CRITICAL"]);
const SERVICES = new Set(["API", "WORKER", "AUTH", "MAIL", "QUEUE"]);
const RETENTION_DAYS = 30;

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const service = searchParams.get("service");
    const query = searchParams.get("query")?.trim().slice(0, 120);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    // Bounded page size: callers cannot request the whole table at once.
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 200);

    const where: Prisma.SystemLogWhereInput = {};
    if (level && level !== "ALL" && LEVELS.has(level)) where.level = level;
    if (service && service !== "ALL" && SERVICES.has(service)) where.service = service;
    if (query) {
      where.OR = [
        { message: { contains: query, mode: "insensitive" } },
        { details: { contains: query, mode: "insensitive" } },
      ];
    }

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if ((fromDate && !Number.isNaN(fromDate.getTime())) || (toDate && !Number.isNaN(toDate.getTime()))) {
      where.createdAt = {
        ...(fromDate && !Number.isNaN(fromDate.getTime()) ? { gte: fromDate } : {}),
        ...(toDate && !Number.isNaN(toDate.getTime()) ? { lte: toDate } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.systemLog.count({ where }),
    ]);

    // Redact secrets and cap payload size before the data ever leaves the server.
    const safeLogs = logs.map((log) => ({
      ...log,
      details: redactDetails(log.details),
    }));

    return NextResponse.json({
      logs: safeLogs,
      pagination: {
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
        currentPage: page,
      },
    });
  } catch (error) {
    // SECURITY FIX: VULN-010 — Return generic error, log details server-side
    console.error("[API] Failed to fetch logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("all") === "true";
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    if (clearAll && searchParams.get("confirm") !== "CLEAR_ALL") {
      // Purging every log is irreversible; require the explicit scope token.
      const { count: eligible } = await countAll(clearAll, cutoff);
      return NextResponse.json(
        {
          error: "Clearing ALL logs requires confirm=CLEAR_ALL.",
          eligible,
          scope: "all",
        },
        { status: 400 }
      );
    }

    const { count: eligible } = await countAll(clearAll, cutoff);

    const result = clearAll
      ? await prisma.systemLog.deleteMany({})
      : await prisma.systemLog.deleteMany({ where: { createdAt: { lt: cutoff } } });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "LOGS_CLEANED",
      target: clearAll ? "ALL" : `older_than_${RETENTION_DAYS}d`,
      details: clearAll
        ? `Cleared ALL system logs (${result.count} removed)`
        : `Cleared system logs older than ${RETENTION_DAYS} days (cutoff ${cutoff.toISOString()}, ${result.count} removed)`,
      ip,
    });

    return NextResponse.json({
      message: "Logs cleaned",
      deleted: result.count,
      eligible,
      cutoff: clearAll ? null : cutoff.toISOString(),
      scope: clearAll ? "all" : `${RETENTION_DAYS}d`,
    });
  } catch (error) {
    console.error("[API] Failed to clear logs:", error);
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}

async function countAll(clearAll: boolean, cutoff: Date): Promise<{ count: number }> {
  const count = clearAll
    ? await prisma.systemLog.count({})
    : await prisma.systemLog.count({ where: { createdAt: { lt: cutoff } } });
  return { count };
}
