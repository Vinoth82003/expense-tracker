import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { send2FACodeEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorOTP: otp,
        twoFactorOTPExpires: expires,
      },
    });

    await send2FACodeEmail(session.user.email, otp);

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error: any) {
    console.error("2FA send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
