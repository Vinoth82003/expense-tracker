import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = await (prisma as any).user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        adminRole: true,
        createdAt: true
      }
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Failed to fetch admin roles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
