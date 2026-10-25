import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/ai/access";
import { validateAiSettings, validateBudgetAlertThreshold } from "@/lib/admin/settings-validation";

// Default Configurations — feature flags are shared with the runtime gate in
// lib/ai/access.ts so the admin form and the enforced defaults cannot drift.
const defaultFeatureFlags = DEFAULT_FEATURE_FLAGS;

const defaultAiSettings = {
  maxReports: 3,
  maxTokens: 4096,
  model: "gemini-2.5-flash",
  quotaAlertThreshold: 80,
  costPer1k: 0.05
};

const defaultMaintenance = {
  enabled: false,
  message: "SpendWise is undergoing maintenance. We'll be back shortly.",
  eta: null,
  adminBypass: true
};

const defaultSmtp = {
  host: "",
  port: 465,
  user: "",
  pass: "",
  fromEmail: "",
  fromName: "SpendWise"
};

const defaultSystemTemplates = {
  maintenanceAnnouncement: "Maintenance announcement",
  twoFactorOverride: "2FA Admin Override",
  accountLockout: "Account Lockout",
  accountUnlock: "Account Unlock",
  accountSuspension: "Account Suspension",
  accountReactivation: "Account Reactivation"
};

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settingsRows = await (prisma as any).settings.findMany();
    
    const settingsMap = settingsRows.reduce((acc: any, row: any) => {
      try {
        acc[row.key] = JSON.parse(row.value);
      } catch (e) {
        acc[row.key] = row.value;
      }
      return acc;
    }, {});

    // SECURITY FIX: VULN-024 — SMTP config is env-only; never expose stored SMTP from DB
    return NextResponse.json({
      featureFlags: settingsMap.featureFlags || defaultFeatureFlags,
      aiSettings: settingsMap.aiSettings || defaultAiSettings,
      maintenance: settingsMap.maintenance || defaultMaintenance,
      systemTemplates: settingsMap.systemTemplates || defaultSystemTemplates,
      budgetAlertThreshold: settingsMap.budgetAlertThreshold ? parseInt(settingsMap.budgetAlertThreshold) : 80,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Mass-assignment guard: only known settings keys may be written.
    const ALLOWED_KEYS = new Set([
      "featureFlags",
      "aiSettings",
      "systemTemplates",
      "budgetAlertThreshold",
    ]);

    const validationErrors: string[] = [];
    const writes: Array<{ key: string; value: string }> = [];

    for (const [key, value] of Object.entries(data)) {
      // SECURITY FIX: VULN-024 — SMTP config is env-only; silently skip SMTP.
      if (key === "smtp") continue;

      if (!ALLOWED_KEYS.has(key)) {
        validationErrors.push(`Unknown setting: ${key}`);
        continue;
      }

      if (key === "aiSettings") {
        const result = validateAiSettings(value);
        if (!result.ok) validationErrors.push(...result.errors);
      }

      if (key === "budgetAlertThreshold") {
        const result = validateBudgetAlertThreshold(value);
        if (!result.ok) validationErrors.push(...result.errors);
      }

      if (key === "featureFlags" && (typeof value !== "object" || value === null || Array.isArray(value))) {
        validationErrors.push("featureFlags must be an object");
      }

      if (key === "systemTemplates") {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          validationErrors.push("systemTemplates must be an object");
        } else {
          for (const [tmplKey, tmplVal] of Object.entries(value as Record<string, unknown>)) {
            if (typeof tmplVal !== "string" || tmplVal.length > 200) {
              validationErrors.push(`systemTemplates.${tmplKey} must be a string of 200 chars or fewer`);
            }
          }
        }
      }

      writes.push({
        key,
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join("; ") }, { status: 400 });
    }

    const adminInfo = await getAdminInfo();
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    for (const { key, value } of writes) {
      await (prisma as any).settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await (prisma as any).auditLog.create({
      data: {
        adminName: adminInfo?.adminName || "Admin",
        adminId: adminInfo?.adminId && /^[0-9a-fA-F]{24}$/.test(adminInfo.adminId) ? adminInfo.adminId : "000000000000000000000000",
        actionType: "SETTING_CHANGED",
        target: writes.map((w) => w.key).join(","),
        details: `Updated settings: ${writes.map((w) => w.key).join(", ")}`,
        ip,
      },
    });

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
