import { NextResponse } from "next/server";

// SECURITY FIX: VULN-020 — Origin/Referer validation for mutation endpoints

const ALLOWED_ORIGINS = new Set<string>();

function getAllowedOrigins(): Set<string> {
  if (ALLOWED_ORIGINS.size === 0) {
    const urls = [
      process.env.NEXTAUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
    ];
    for (const url of urls) {
      if (url) {
        try {
          const parsed = new URL(url);
          ALLOWED_ORIGINS.add(parsed.origin);
        } catch {}
      }
    }
  }
  return ALLOWED_ORIGINS;
}

export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow missing origin for same-origin requests from server-side (e.g., Next.js server actions)
  if (!origin && !referer) {
    return null;
  }

  const allowed = getAllowedOrigins();

  if (origin) {
    if (allowed.has(origin)) {
      return null;
    }
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (allowed.has(refOrigin)) {
        return null;
      }
    } catch {}
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
