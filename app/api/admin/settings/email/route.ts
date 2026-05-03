import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await req.json();

    // Fetch existing to handle masked password updates
    const existingRow = await (prisma as any).settings.findUnique({
      where: { key: "smtp" }
    });
    
    let existingPass = "";
    if (existingRow) {
      try {
        const parsed = JSON.parse(existingRow.value);
        existingPass = parsed.pass || "";
      } catch (e) {}
    }

    const settingsToSave = {
      host: config.host || "",
      port: parseInt(config.port) || 465,
      user: config.user || "",
      // If client sends empty password, preserve existing
      pass: config.pass ? config.pass : existingPass,
      fromEmail: config.fromEmail || "",
      fromName: config.fromName || "SpendWise"
    };

    // Save to DB
    await (prisma as any).settings.upsert({
      where: { key: "smtp" },
      update: { value: JSON.stringify(settingsToSave) },
      create: { key: "smtp", value: JSON.stringify(settingsToSave) }
    });

    // Log to audit trail
    const headerList = await req.headers;
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";
    await (prisma as any).auditLog.create({
      data: {
        adminName: "Admin",
        adminId: "65f1a2b3c4d5e6f7a8b9c0d1", // Placeholder
        actionType: "SETTING_CHANGED",
        target: "smtp",
        details: `SMTP configuration updated`,
        ip
      }
    });

    // Mask password in response
    return NextResponse.json({ 
      message: "SMTP settings updated", 
      smtp: { ...settingsToSave, pass: settingsToSave.pass ? "********" : "" } 
    });
  } catch (error) {
    console.error("Failed to update SMTP settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
