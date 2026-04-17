import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { send2FAToggleEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { twoFactorEnabled: enabled },
    });

    // Get system info for email
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ip = request.headers.get("x-forwarded-for") || "Unknown";

    await send2FAToggleEmail(user.email, enabled, { ip, userAgent });

    return NextResponse.json({ success: true, enabled: user.twoFactorEnabled });
  } catch (error: any) {
    console.error("2FA toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
