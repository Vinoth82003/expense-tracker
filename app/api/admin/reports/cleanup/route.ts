import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { olderThanDays } = await req.json();
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThanDays));

    const result = await (prisma as any).report.deleteMany({
      where: { date: { lt: date } }
    });

    return NextResponse.json({ 
      message: `Cleaned up ${result.count} reports`,
      count: result.count
    });
  } catch (error) {
    console.error("Failed to cleanup reports:", error);
    return NextResponse.json({ error: "Failed to cleanup reports" }, { status: 500 });
  }
}
