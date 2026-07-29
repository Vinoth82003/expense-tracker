import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await req.json();

    const settingsToSave = {
      enabled: !!config.enabled,
      message: config.message || "SpendWise is undergoing maintenance. We'll be back shortly.",
      eta: config.eta || null,
      adminBypass: !!config.adminBypass
    };

    // Save to DB
    await (prisma as any).settings.upsert({
      where: { key: "maintenance" },
      update: { value: JSON.stringify(settingsToSave) },
      create: { key: "maintenance", value: JSON.stringify(settingsToSave) }
    });

    // Log to audit trail
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    const adminInfo = await getAdminInfo();
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: adminInfo?.adminId || "unknown",
        actionType: "SETTING_CHANGED",
        target: "maintenance",
        details: `Maintenance mode turned ${settingsToSave.enabled ? 'ON' : 'OFF'}`,
        ip
      }
    });

    return NextResponse.json({ message: "Maintenance settings updated", maintenance: settingsToSave });
  } catch (error) {
    console.error("Failed to update maintenance settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
