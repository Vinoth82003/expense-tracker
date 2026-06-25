import { verifyAdminSession } from "@/lib/admin-auth";
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
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin",
        adminId: "65f1a2b3c4d5e6f7a8b9c0d1", // Placeholder
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
