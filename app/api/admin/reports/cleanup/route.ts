import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";

const MIN_DAYS = 1;
const MAX_DAYS = 3650;

function cutoffFor(days: number): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

/** Preview: how many reports would be removed for a given retention window. */
export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("olderThanDays") || "");
    if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
      return NextResponse.json(
        { error: `olderThanDays must be an integer between ${MIN_DAYS} and ${MAX_DAYS}.` },
        { status: 400 }
      );
    }
    const cutoff = cutoffFor(days);
    const count = await prisma.report.count({ where: { date: { lt: cutoff } } });
    return NextResponse.json({ eligible: count, cutoff: cutoff.toISOString(), olderThanDays: days });
  } catch (error) {
    console.error("[API] Failed to preview report cleanup:", error);
    return NextResponse.json({ error: "Failed to preview cleanup" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const days = Number(body?.olderThanDays);
    if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
      return NextResponse.json(
        { error: `olderThanDays must be an integer between ${MIN_DAYS} and ${MAX_DAYS}.` },
        { status: 400 }
      );
    }

    const cutoff = cutoffFor(days);
    const eligible = await prisma.report.count({ where: { date: { lt: cutoff } } });

    const result = await prisma.report.deleteMany({ where: { date: { lt: cutoff } } });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "REPORTS_CLEANED",
      target: `older_than_${days}d`,
      details: `Deleted ${result.count} report(s) older than ${days} days (cutoff ${cutoff.toISOString()})`,
      ip,
    });

    return NextResponse.json({
      message: `Cleaned up ${result.count} report(s) older than ${days} days`,
      count: result.count,
      eligible,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("[API] Failed to cleanup reports:", error);
    return NextResponse.json({ error: "Failed to cleanup reports" }, { status: 500 });
  }
}
