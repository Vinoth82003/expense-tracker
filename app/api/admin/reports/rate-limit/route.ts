import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maxPerDay } = await req.json();
    
    await (prisma as any).settings.upsert({
      where: { key: 'maxReportsPerDay' },
      update: { value: maxPerDay.toString() },
      create: { key: 'maxReportsPerDay', value: maxPerDay.toString() }
    });

    return NextResponse.json({ message: "Rate limit updated successfully" });
  } catch (error) {
    console.error("Failed to update rate limit:", error);
    return NextResponse.json({ error: "Failed to update rate limit" }, { status: 500 });
  }
}
