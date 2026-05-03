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
    const blocklist = await (prisma as any).blockedIP.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(blocklist);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ip, note } = await req.json();
    const adminName = "Admin";

    const blocked = await (prisma as any).blockedIP.upsert({
      where: { ip },
      update: { note, addedBy: adminName },
      create: { ip, note, addedBy: adminName }
    });

    return NextResponse.json(blocked);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
