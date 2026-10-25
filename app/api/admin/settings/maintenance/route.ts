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

    // --- Validation (server-side; never trust the client) ---
    const enabled = config.enabled === true;
    const adminBypass = config.adminBypass === true;

    let message = typeof config.message === "string" ? config.message.trim() : "";
    if (message.length > 500) {
      return NextResponse.json({ error: "Message must be 500 characters or fewer." }, { status: 400 });
    }
    if (!message) {
      message = "SpendWise is undergoing maintenance. We'll be back shortly.";
    }

    let eta: string | null = null;
    if (config.eta) {
      const parsed = new Date(config.eta);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Maintenance ETA is not a valid date/time." }, { status: 400 });
      }
      if (enabled && parsed.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Maintenance ETA must be in the future while maintenance mode is enabled." },
          { status: 400 }
        );
      }
      eta = parsed.toISOString();
    }

    const settingsToSave = { enabled, message, eta, adminBypass };

    // Capture the previous value for an auditable before/after record.
    const previousRow = await (prisma as any).settings.findUnique({ where: { key: "maintenance" } });
    let previous: unknown = null;
    if (previousRow?.value) {
      try {
        previous = JSON.parse(previousRow.value);
      } catch {
        previous = null;
      }
    }

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
    const safeAdminId = (adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId))
      ? adminInfo.adminId
      : "000000000000000000000000";
    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: safeAdminId,
        actionType: "SETTING_CHANGED",
        target: "maintenance",
        details: `Maintenance mode turned ${enabled ? 'ON' : 'OFF'}${
          eta ? ` (ETA ${eta})` : ''
        }. Before=${JSON.stringify(previous)} After=${JSON.stringify(settingsToSave)}`,
        ip
      }
    });

    return NextResponse.json({ message: "Maintenance settings updated", maintenance: settingsToSave });
  } catch (error) {
    console.error("Failed to update maintenance settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
