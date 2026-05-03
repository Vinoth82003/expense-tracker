import { NextRequest, NextResponse } from "next/server";
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
