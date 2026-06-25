import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      (prisma as any).notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      (prisma as any).notification.count()
    ]);

    return NextResponse.json({ history, total });
  } catch (error) {
    console.error("Failed to fetch notification history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
