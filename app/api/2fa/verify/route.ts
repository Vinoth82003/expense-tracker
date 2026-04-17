import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { twoFactorOTP: true, twoFactorOTPExpires: true },
    });

    if (!user?.twoFactorOTP || !user?.twoFactorOTPExpires) {
      return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > user.twoFactorOTPExpires) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (user.twoFactorOTP !== otp) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    // Clear OTP from DB
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorOTP: null,
        twoFactorOTPExpires: null,
      },
    });

    // Set secure cookie to mark session as 2FA verified
    const cookieStore = await cookies();
    cookieStore.set("2fa_verified", "true", {
      httpOnly: false, // Must be false so document.cookie can see it in client-side layout.tsx
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
