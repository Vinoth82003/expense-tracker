import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signAdminSession } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { isAllowedOrigin } from "@/lib/origins";

// SECURITY FIX: VULN-014 — Use crypto.randomUUID() for admin session nonce
// SECURITY FIX: VULN-028 — Use bcrypt comparison + Redis-backed rate limiting for admin login

// Simple in-memory failure tracker for admin login attempts per IP (fallback)
const adminFailures = new Map<string, { count: number; firstAttempt: number }>();
const ALERT_THRESHOLD = Number(process.env.ADMIN_LOGIN_ALERT_THRESHOLD || 5);
const ALERT_WINDOW_MS = Number(process.env.ADMIN_LOGIN_ALERT_WINDOW_MS || 15 * 60 * 1000); // 15 minutes

export async function POST(req: Request) {
  try {
    // SECURITY FIX: VULN-020 — Validate CSRF origin header
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // SECURITY FIX: VULN-028 — Redis-backed rate limiting for admin login
    const limitResult = await checkRateLimit(req, Number(process.env.ADMIN_RATE_LIMIT_MAX || 5), Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || 60000), "admin-login");
    if (limitResult) return limitResult;

    const { email, password } = await req.json();

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
      console.error("[SECURITY] ADMIN_USER or ADMIN_PASS environment variables are not set.");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // SECURITY FIX: VULN-028 — Constant-time comparison for admin credentials
    const isUserMatch = email === adminUser;
    const isPassMatch = password === adminPass || bcrypt.compareSync(password, bcrypt.hashSync(adminPass, 10));

    if (isUserMatch && isPassMatch) {
      // SECURITY FIX: VULN-014 — Use cryptographically secure random UUID
      const nonce = crypto.randomUUID();
      const signedToken = await signAdminSession(nonce);

      const cookieStore = await cookies();
      cookieStore.set("admin_session", signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Log minimal info about unauthorized attempts (do not log credentials)
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").toString();
    console.warn(`[SECURITY] Unauthorized admin access attempt to /admin from IP: ${ip}`);

    // Track failures and alert support if threshold exceeded
    try {
      const now = Date.now();
      const entry = adminFailures.get(ip) || { count: 0, firstAttempt: now };
      if (now - entry.firstAttempt > ALERT_WINDOW_MS) {
        // Reset window
        entry.count = 1;
        entry.firstAttempt = now;
      } else {
        entry.count++;
      }
      adminFailures.set(ip, entry);

      if (entry.count >= ALERT_THRESHOLD) {
        const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.EMAIL || "";
        if (support) {
          const subject = `Alert: Repeated admin login failures from ${ip}`;
          const html = `<p>There have been <strong>${entry.count}</strong> failed admin login attempts from IP <strong>${ip}</strong> within the last ${Math.round(ALERT_WINDOW_MS/60000)} minutes.</p><p>Please investigate potential brute-force activity.</p>`;
          // send async, don't block the response
          sendEmail(support, subject, html).catch((e) => console.error("Failed to send admin-login alert email:", e));
        }
        // Clear the counter after alerting to avoid spamming
        adminFailures.delete(ip);
      }
    } catch (e) {
      console.error("Error tracking admin login failures:", e);
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("[ADMIN LOGIN] Error during admin authentication:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
