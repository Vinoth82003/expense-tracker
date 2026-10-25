import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_LOCKOUTS = 500;

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lockedUsers = await prisma.user.findMany({
      where: { isLocked: true },
      select: {
        id: true,
        name: true,
        email: true,
        lockedAt: true,
        lockReason: true,
      },
      orderBy: { lockedAt: "desc" },
      take: MAX_LOCKOUTS,
    });

    return NextResponse.json(lockedUsers);
  } catch (error) {
    console.error("Failed to fetch lockouts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
