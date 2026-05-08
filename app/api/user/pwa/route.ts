import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { installed } = await req.json();

    await prisma.user.update({
      where: { email: session.user.email },
      data: { isPWAInstalled: !!installed }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update PWA status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
