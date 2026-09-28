import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkUserRateLimit } from "@/lib/rateLimit";
import { verifyOtp } from "@/lib/otp";
import { getRequestMeta } from "@/lib/request-meta";

// SECURITY FIX: SEC-01 — verification is now recorded server-side in
// twoFactorVerifiedAt. The previous version only set an httpOnly cookie that the
// client could not read, so nothing server-side ever observed a completed
// challenge. lib/user-entitlement.ts + middleware now enforce it.
// SECURITY FIX: SEC-08 — attempt limiting moved off a per-instance in-memory Map
// onto the shared Redis limiter. The window is also enforced durably: reaching
// the cap invalidates the pending OTP, so the lockout survives a serverless
// cold start instead of resetting with the instance.
// SECURITY FIX: SEC-09 — OTPs are stored and compared as HMACs.
// SECURITY FIX: SEC-10 — real client IP / user agent are recorded.

const MAX_2FA_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { otp } = body;

    if (!otp || typeof otp !== "string" || otp.length !== 6) {
      return NextResponse.json({ error: "A valid 6-digit OTP is required" }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { ip, userAgent } = getRequestMeta(request);

    const limited = await checkUserRateLimit(
      userId,
      "2fa-verify",
      MAX_2FA_ATTEMPTS,
      RATE_LIMIT_WINDOW_MS
    );
    if (limited) return limited;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorOTP: true, twoFactorOTPExpires: true },
    });

    if (!user?.twoFactorOTP || !user?.twoFactorOTPExpires) {
      return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > user.twoFactorOTPExpires) {
      // Clear the stale code so a new request starts clean.
      await prisma.user
        .update({
          where: { id: userId },
          data: { twoFactorOTP: null, twoFactorOTPExpires: null },
        })
        .catch(() => {});
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // SECURITY FIX: SEC-09 / SEC-025 — constant-time comparison of the HMAC.
    if (!verifyOtp(otp, user.twoFactorOTP)) {
      // SECURITY FIX: SEC-08 — invalidate the code once the attempt cap is hit.
      // Previously this lived in an in-memory Map that was per-instance and reset
      // on every cold start, so on serverless the cap was effectively unenforced.
      // Counting FAILED rows makes the lockout durable and horizontally shared.
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
      const failedCount = await prisma.oTPLog.count({
        where: { userId, status: "FAILED", createdAt: { gte: windowStart } },
      });
      const capReached = failedCount + 1 >= MAX_2FA_ATTEMPTS;

      if (capReached) {
        await prisma.user
          .update({
            where: { id: userId },
            data: { twoFactorOTP: null, twoFactorOTPExpires: null },
          })
          .catch(() => {});
      }

      await prisma.oTPLog.create({
        data: {
          userId,
          email: session.user.email,
          status: "FAILED",
          ip,
          userAgent,
          expiresAt: user.twoFactorOTPExpires,
        }
      }).catch(() => {});

      return NextResponse.json(
        capReached
          ? { error: "Too many failed attempts. Please request a new OTP." }
          : { error: "Invalid OTP." },
        { status: capReached ? 429 : 400 }
      );
    }

    // Single-use: clear the code and record the successful challenge. This field
    // is what the middleware entitlement gate reads.
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorOTP: null,
        twoFactorOTPExpires: null,
        twoFactorVerifiedAt: new Date(),
      },
    });

    await prisma.oTPLog.create({
      data: {
        userId,
        email: session.user.email,
        status: "SUCCESS",
        ip,
        userAgent,
        expiresAt: user.twoFactorOTPExpires,
      }
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
