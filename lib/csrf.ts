import { NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/origins";

// SECURITY FIX: VULN-020 — Origin/Referer validation for mutation endpoints
// Allowlist is shared with CORS via lib/origins (all SpendWise deployments).

export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow missing origin for same-origin requests from server-side (e.g., Next.js server actions)
  if (!origin && !referer) {
    return null;
  }

  if (isAllowedOrigin(origin)) {
    return null;
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (isAllowedOrigin(refOrigin)) {
        return null;
      }
    } catch {}
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
