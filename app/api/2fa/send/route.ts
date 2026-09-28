import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { send2FACodeEmail } from "@/lib/mail";
import { checkUserRateLimit } from "@/lib/rateLimit";
import { generateOtp, hashOtp } from "@/lib/otp";
import { getRequestMeta } from "@/lib/request-meta";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY FIX: SEC-08 — was an unbounded in-memory tracker, which is
    // per-instance on serverless and resets on every cold start. Now backed by
    // the shared Redis limiter (see lib/rate-limit-redis.ts).
    const limited = await checkUserRateLimit(
      userId,
      "2fa-send",
      MAX_SENDS_PER_WINDOW,
      SEND_WINDOW_MS
    );
    if (limited) return limited;

    // SECURITY FIX: SEC-09 — the plaintext code is emailed, but only its HMAC
    // is persisted, so a database read cannot recover a live code.
    const otp = generateOtp();
    const expires = new Date(Date.now() + OTP_TTL_MS);
    const { ip, userAgent } = getRequestMeta(request);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorOTP: hashOtp(otp),
        twoFactorOTPExpires: expires,
        // A new challenge invalidates any earlier completed verification.
        twoFactorVerifiedAt: null,
      },
    });

    await send2FACodeEmail(session.user.email, otp);

    // SECURITY FIX: SEC-10 — was a hardcoded "0.0.0.0" placeholder.
    await prisma.oTPLog.create({
      data: {
        userId,
        email: session.user.email,
        status: "EXPIRED", // Default to expired until verified
        ip,
        userAgent,
        expiresAt: expires,
      }
    }).catch((e: unknown) => console.error("Failed to log OTP:", e));

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error: unknown) {
    console.error("2FA send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
