import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key } = await params;
    const { enabled } = await req.json();

    // Fetch existing feature flags
    const existing = await (prisma as any).settings.findUnique({
      where: { key: "featureFlags" }
    });

    let flags: any = {
      aiAnalysis: true,
      pdfExport: true,
      twoFactorAuth: true,
      pwaPrompt: true,
      budgetAlerts: true,
      customSubcategories: true
    };

    if (existing) {
      try {
        flags = JSON.parse(existing.value);
      } catch (e) {
        // Fallback to default
      }
    }

    // Update the specific flag
    if (Object.keys(flags).includes(key)) {
      flags[key] = enabled;
    } else {
       return NextResponse.json({ error: "Invalid feature flag key" }, { status: 400 });
    }

    // Save back to DB
    await (prisma as any).settings.upsert({
      where: { key: "featureFlags" },
      update: { value: JSON.stringify(flags) },
      create: { key: "featureFlags", value: JSON.stringify(flags) }
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
        target: "featureFlags",
        details: `Feature flag '${key}' set to ${enabled}`,
        ip
      }
    });

    return NextResponse.json({ message: "Feature flag updated", flags });
  } catch (error) {
    console.error("Failed to update feature flag:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
