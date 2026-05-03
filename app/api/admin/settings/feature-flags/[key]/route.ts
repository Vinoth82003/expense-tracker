import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await isAdmin())) {
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
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin",
        adminId: "65f1a2b3c4d5e6f7a8b9c0d1", // Placeholder
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
