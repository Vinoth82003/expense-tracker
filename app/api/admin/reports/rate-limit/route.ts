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
