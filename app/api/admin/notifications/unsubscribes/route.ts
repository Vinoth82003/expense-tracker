import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const unsubscribes = await (prisma as any).unsubscribe.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(unsubscribes);
  } catch (error) {
    console.error("Failed to fetch unsubscribes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
