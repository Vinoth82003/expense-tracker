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
