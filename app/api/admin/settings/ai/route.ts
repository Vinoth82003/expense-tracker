import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aiConfig = await req.json();

    // Validate inputs loosely
    const settingsToSave = {
      maxReports: parseInt(aiConfig.maxReports) || 3,
      maxTokens: parseInt(aiConfig.maxTokens) || 4096,
      model: aiConfig.model || "gemini-1.5-flash",
      quotaAlertThreshold: parseInt(aiConfig.quotaAlertThreshold) || 80,
      costPer1k: parseFloat(aiConfig.costPer1k) || 0.05
    };

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
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: adminInfo?.adminId || "unknown",
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
