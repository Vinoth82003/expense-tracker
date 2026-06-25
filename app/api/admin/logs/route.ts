import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const service = searchParams.get("service");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (level && level !== "ALL") where.level = level;
    if (service && service !== "ALL") where.service = service;

    const [logs, total] = await Promise.all([
      (prisma as any).systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).systemLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error: any) {
    console.error("[API] Failed to fetch logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Only allow clearing old logs (e.g., older than 30 days)
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("all") === "true";

    if (clearAll) {
      await (prisma as any).systemLog.deleteMany({});
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await (prisma as any).systemLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Failed to clear logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
