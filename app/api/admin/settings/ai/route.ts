import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAiSettings } from "@/lib/admin/settings-validation";

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aiConfig = await req.json();

    const validation = validateAiSettings(aiConfig);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors.join("; ") }, { status: 400 });
    }
    const settingsToSave = validation.value;

    // Save to DB
    await (prisma as any).settings.upsert({
      where: { key: "aiSettings" },
      update: { value: JSON.stringify(settingsToSave) },
      create: { key: "aiSettings", value: JSON.stringify(settingsToSave) }
    });

    // Log to audit trail
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    const adminInfo = await getAdminInfo();
    const safeAdminId = (adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId))
      ? adminInfo.adminId
      : "000000000000000000000000";
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: safeAdminId,
        actionType: "SETTING_CHANGED",
        target: "aiSettings",
        details: `AI settings updated. Model: ${settingsToSave.model}`,
        ip
      }
    });

    return NextResponse.json({ message: "AI settings updated", aiSettings: settingsToSave });
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
