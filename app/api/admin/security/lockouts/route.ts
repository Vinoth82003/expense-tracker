import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lockedUsers = await (prisma as any).user.findMany({
      where: { isLocked: true },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        lockedAt: true, 
        lockReason: true 
      },
      orderBy: { lockedAt: 'desc' }
    });

    return NextResponse.json(lockedUsers);
  } catch (error) {
    console.error("Failed to fetch lockouts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
