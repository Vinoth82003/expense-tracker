import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

// Default Configurations
const defaultFeatureFlags = {
  aiAnalysis: true,
  pdfExport: true,
  twoFactorAuth: true,
  pwaPrompt: true,
  budgetAlerts: true,
  customSubcategories: true
};

const defaultAiSettings = {
  maxReports: 3,
  maxTokens: 4096,
  model: "gemini-1.5-flash",
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

export async function GET() {
  if (!(await isAdmin())) {
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

    return NextResponse.json({
      featureFlags: settingsMap.featureFlags || defaultFeatureFlags,
      aiSettings: settingsMap.aiSettings || defaultAiSettings,
      maintenance: settingsMap.maintenance || defaultMaintenance,
      smtp: settingsMap.smtp || defaultSmtp,
      budgetAlertThreshold: settingsMap.budgetAlertThreshold ? parseInt(settingsMap.budgetAlertThreshold) : 80,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    for (const [key, value] of Object.entries(data)) {
      await (prisma as any).settings.upsert({
        where: { key },
        update: { value: typeof value === 'object' ? JSON.stringify(value) : String(value) },
        create: { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) }
      });
    }

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
