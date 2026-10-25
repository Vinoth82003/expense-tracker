import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const maxPerDay = Number(body?.maxPerDay);
    if (!Number.isInteger(maxPerDay) || maxPerDay < 1 || maxPerDay > 1000) {
      return NextResponse.json(
        { error: "maxPerDay must be an integer between 1 and 1000." },
        { status: 400 }
      );
    }

    const previous = await prisma.settings.findUnique({ where: { key: "maxReportsPerDay" } });

    await prisma.settings.upsert({
      where: { key: "maxReportsPerDay" },
      update: { value: String(maxPerDay) },
      create: { key: "maxReportsPerDay", value: String(maxPerDay) },
    });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "REPORT_RATE_LIMIT_UPDATED",
      target: "maxReportsPerDay",
      details: `Report rate limit changed (Before=${previous?.value ?? "3(default)"}, After=${maxPerDay})`,
      ip,
    });

    return NextResponse.json({ message: "Rate limit updated successfully", maxPerDay });
  } catch (error) {
    console.error("[API] Failed to update rate limit:", error);
    return NextResponse.json({ error: "Failed to update rate limit" }, { status: 500 });
  }
}
