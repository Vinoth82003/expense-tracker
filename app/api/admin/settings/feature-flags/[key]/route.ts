import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/ai/access";

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

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    // Fetch existing feature flags
    const existing = await (prisma as any).settings.findUnique({
      where: { key: "featureFlags" }
    });

    // Merge over defaults so flags added after this row was written (e.g.
    // chatAssistant) are accepted instead of rejected as unknown keys.
    let stored: Record<string, unknown> = {};
    if (existing) {
      try {
        stored = JSON.parse(existing.value);
      } catch (e) {
        // Fallback to default
      }
    }

    const flags: Record<string, boolean> = {
      ...DEFAULT_FEATURE_FLAGS,
      ...stored,
    } as Record<string, boolean>;

    if (!Object.prototype.hasOwnProperty.call(DEFAULT_FEATURE_FLAGS, key)) {
      return NextResponse.json({ error: "Invalid feature flag key" }, { status: 400 });
    }

    flags[key] = enabled;

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
    const safeAdminId = (adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId))
      ? adminInfo.adminId
      : "000000000000000000000000";
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: safeAdminId,
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
