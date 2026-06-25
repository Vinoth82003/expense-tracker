import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Simple in‑memory rate limiter – suitable for low‑traffic endpoints.
const rateLimits = new Map<string, { count: number; first: number }>();
function checkRateLimit(ip: string, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entryKey = `${ip}:${key}`;
  const record = rateLimits.get(entryKey) ?? { count: 0, first: now };
  if (now - record.first > windowMs) {
    // Reset window
    record.count = 1;
    record.first = now;
  } else {
    record.count++;
  }
  rateLimits.set(entryKey, record);
  return record.count <= limit;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || (request as any).ip || "unknown";

  // ---- Rate limiting ----
  if (pathname.startsWith("/api/contact")) {
    if (!checkRateLimit(ip, "contact", 5, 15 * 60 * 1000)) {
      return new NextResponse("Too many requests – please try again later.", { status: 429 });
    }
  }
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/login")) {
    if (!checkRateLimit(ip, "login", 10, 15 * 60 * 1000)) {
      return new NextResponse("Too many login attempts – please try again later.", { status: 429 });
    }
  }

  // ---- Protected routes (server‑side) ----
  const protectedPaths = [
    "/dashboard",
    "/expenses",
    "/income",
    "/groups",
    "/reports",
    "/notifications",
    "/settings",
    "/onboarding",
    "/analyze",
    "/feedback",
    "/profile",
  ];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ---- Admin guard (existing) ----
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("admin_session");
    if (!adminSession?.value) {
      console.warn(`[SECURITY] Unauthorized admin access attempt to ${pathname} from IP: ${ip}`);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/income/:path*",
    "/groups/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/analyze/:path*",
    "/feedback/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/api/contact",
    "/api/auth/:path*",
    "/api/login",
  ],
};
