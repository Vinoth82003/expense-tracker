// Single source of truth for the multi-origin deployment topology.
//
//   Marketing site:            https://thespendwise.vercel.app
//   Primary app + Google auth: https://money-spend-tracker.vercel.app
//   Secondary app instance:    https://expense-tracker-black-nine-57.vercel.app
//
// This module owns the CORS/CSRF allowlist and the cross-origin auth bridge.
// The resolved primary/marketing origins are owned by lib/site-url.ts so that
// the allowlist, the SEO surfaces and outbound email can never disagree about
// which host is which.
//
// All deployments of this repo share one database and one NEXTAUTH_SECRET.
// Google OAuth is only configured on the primary app origin; sign-ins started
// on any other origin redirect there and are bridged back after auth completes
// (see app/bridge/page.tsx and app/auth/bridge/route.ts).

import { APP_ORIGIN, SITE_ORIGIN } from "./site-url";

function normalizeOrigin(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export const PRIMARY_APP_ORIGIN = APP_ORIGIN;

export const MARKETING_ORIGIN = SITE_ORIGIN;

const SIBLING_APP_ORIGINS = ["https://expense-tracker-black-nine-57.vercel.app"];

const EXTRA_ORIGINS = (process.env.NEXT_PUBLIC_EXTRA_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => normalizeOrigin(s))
  .filter((o): o is string => Boolean(o));

export function getAllowedOrigins(): string[] {
  return Array.from(
    new Set(
      [
        PRIMARY_APP_ORIGIN,
        MARKETING_ORIGIN,
        ...SIBLING_APP_ORIGINS,
        ...EXTRA_ORIGINS,
        // NEXTAUTH_URL is deliberately absent. It is the Auth.js callback base,
        // not a peer origin: folding it in meant a misconfigured deployment
        // silently widened its own CORS/CSRF allowlist. PRIMARY_APP_ORIGIN and
        // MARKETING_ORIGIN already absorb the *_APP_URL / *_PRODUCTION_LINK
        // variables via lib/site-url.ts, so nothing legitimate is lost.
        "http://localhost:3000",
      ].filter((o): o is string => Boolean(o))
    )
  );
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  const normalized = origin ? normalizeOrigin(origin) : null;
  return Boolean(normalized && getAllowedOrigins().includes(normalized));
}

export function isPrimaryAppOrigin(origin: string | null | undefined): boolean {
  const normalized = origin ? normalizeOrigin(origin) : null;
  return Boolean(normalized && normalized === PRIMARY_APP_ORIGIN);
}

export function isMarketingOrigin(origin: string | null | undefined): boolean {
  const normalized = origin ? normalizeOrigin(origin) : null;
  return Boolean(normalized && normalized === MARKETING_ORIGIN);
}

// Real sibling deployments that should be bounced to the primary app origin
// for sign-in. Localhost/dev hosts are excluded so local development is never
// redirected to production.
export function isManagedAppOrigin(origin: string | null | undefined): boolean {
  const normalized = origin ? normalizeOrigin(origin) : null;
  if (!normalized || isPrimaryAppOrigin(normalized) || isMarketingOrigin(normalized)) {
    return false;
  }
  const hostname = new URL(normalized).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) {
    return false;
  }
  return isAllowedOrigin(normalized);
}

export function currentOriginFromHeaders(
  host: string | null,
  proto: string | null
): string | null {
  if (!host) return null;
  return normalizeOrigin(`${proto || "https"}://${host}`);
}
