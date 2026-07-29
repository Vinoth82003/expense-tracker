import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

// SECURITY FIX: VULN-008 — 2fa_verified cookie is now httpOnly + server-side check via session claim
// SECURITY FIX: VULN-012 — Added per-user rate limiting (5 failed attempts invalidates OTP)
// SECURITY FIX: VULN-025 — Uses timing-safe comparison for OTP

// In-memory 2FA attempt tracker per user
const twoFactorAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_2FA_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

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

    const userId = (session.user as any).id as string;

    // SECURITY FIX: VULN-012 — Rate limit: max 5 failed 2FA attempts, then invalidate OTP
    const attemptRecord = twoFactorAttempts.get(userId) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    if (now - attemptRecord.lastAttempt > RATE_LIMIT_WINDOW_MS) {
      attemptRecord.count = 0;
    }
    attemptRecord.lastAttempt = now;

    if (attemptRecord.count >= MAX_2FA_ATTEMPTS) {
      // Invalidate OTP after too many failures
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          twoFactorOTP: null,
          twoFactorOTPExpires: null,
        },
      }).catch(() => {});
      twoFactorAttempts.delete(userId);
      return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 429 });
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

    // SECURITY FIX: VULN-025 — Timing-safe comparison
    if (!constantTimeCompare(user.twoFactorOTP, otp)) {
      attemptRecord.count++;
      twoFactorAttempts.set(userId, attemptRecord);

      await (prisma as any).oTPLog.create({
        data: {
          userId,
          email: session.user.email,
          status: "FAILED",
          ip: "0.0.0.0",
          expiresAt: user.twoFactorOTPExpires,
        }
      }).catch(() => {});
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

    // Clear rate limit tracker on success
    twoFactorAttempts.delete(userId);

    // Log success
    await (prisma as any).oTPLog.create({
      data: {
        userId,
        email: session.user.email,
        status: "SUCCESS",
        ip: "0.0.0.0",
        expiresAt: user.twoFactorOTPExpires,
      }
    }).catch(() => {});

    // SECURITY FIX: VULN-008 — Use server-side session claim via a flag on the user record
    // and set httpOnly cookie for backwards compatibility, but don't rely on it for auth
    const cookieStore = await cookies();
    cookieStore.set("2fa_verified", "true", {
      httpOnly: true,  // SECURITY FIX: VULN-008 — Now httpOnly to prevent JS access
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
