import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAdminToken } from "@/lib/admin-auth";

function isTrustedInternalRequest(request: NextRequest) {
  const userId = request.headers.get("x-internal-user-id");
  const secret = request.headers.get("x-internal-api-secret");
  const expected = process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET;
  return Boolean(userId && secret && expected && secret === expected);
}

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
  const rateLimitedAuthPaths = [
    "/api/auth/callback",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/login",
  ];
  if (rateLimitedAuthPaths.some((path) => pathname.startsWith(path))) {
    if (!checkRateLimit(ip, "login", 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
  }
   // Rate‑limit the paid AI endpoint to prevent billing abuse
   // ---- Staging-only rate-limit override for /api/analyze ----
   // TEMPORARY — added to collect Groq-vs-Gemini parallel-run samples for the
   // V4 go-live gate. Remove this block once staging deltas are collected.
   //
   // Safety: only takes effect if ANALYZE_RATE_LIMIT_OVERRIDE is explicitly set
   // AND NODE_ENV is not "production" — a forgotten env var alone can't affect prod.
   const isStagingOverrideActive =
     process.env.NODE_ENV !== "production" &&
     process.env.ANALYZE_RATE_LIMIT_OVERRIDE === "true";

   const ANALYZE_RATE_LIMIT = isStagingOverrideActive
     ? { max: 20, windowMs: 60 * 60 * 1000 } // staging: 20/hour while collecting samples
     : { max: 5, windowMs: 60 * 60 * 1000 }; // production: unchanged V3 limit

   if (pathname.startsWith("/api/analyze")) {
     if (!checkRateLimit(ip, "analyze", ANALYZE_RATE_LIMIT.max, ANALYZE_RATE_LIMIT.windowMs)) {
       return new NextResponse(
         JSON.stringify({ error: "Too many AI analysis requests. Please wait before trying again." }),
         { status: 429, headers: { "Content-Type": "application/json" } }
       );
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

  // ---- Protect authenticated API routes ----
  const protectedApiPaths = [
    "/api/chat",
    "/api/expenses",
    "/api/income",
    "/api/analyze",
    "/api/budget",
    "/api/categories",
    "/api/groups",
    "/api/invitations",
    "/api/onboarding",
    "/api/profile",
    "/api/user",
  ];
  if (protectedApiPaths.some((p) => pathname.startsWith(p))) {
    if (isTrustedInternalRequest(request)) {
      return NextResponse.next();
    }
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ---- Admin guard — signed HMAC token verification ----
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminCookie = request.cookies.get("admin_session");
    const isValidAdmin = adminCookie?.value ? await verifyAdminToken(adminCookie.value) : false;
    if (!isValidAdmin) {
      console.warn(`[SECURITY] Unauthorized admin access attempt to ${pathname} from IP: ${ip}`);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // ---- Admin API guard — signed HMAC token verification ----
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
    const adminCookie = request.cookies.get("admin_session");
    const isValidAdmin = adminCookie?.value ? await verifyAdminToken(adminCookie.value) : false;
    if (!isValidAdmin) {
      console.warn(`[SECURITY] Unauthorized admin API access attempt to ${pathname} from IP: ${ip}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    "/api/chat",
    "/api/auth/:path*",
    "/api/login",
    "/api/analyze",
    "/api/expenses/:path*",
    "/api/income/:path*",
    "/api/admin/:path*",
    "/api/budget/:path*",
    "/api/categories/:path*",
    "/api/groups/:path*",
    "/api/invitations/:path*",
    "/api/onboarding/:path*",
    "/api/profile/:path*",
    "/api/user/:path*",
  ],
};
