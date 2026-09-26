// Single source of truth for every user-facing absolute URL in the app.
//
// WHY THIS FILE EXISTS
// -------------------
// Absolute URLs used to be built ad-hoc from `NEXTAUTH_URL` in ~9 places
// (all of lib/mail.ts, app/api/invitations/send, lib/chat/v1/api-gateway.ts)
// and from a hardcoded "https://thespendwise.vercel.app" string literal in
// ~20 more (every metadata / sitemap / robots / JSON-LD surface).
//
// Because `NEXTAUTH_URL` is `http://localhost:3000` in local dev and is not
// guaranteed to be set correctly on every deployment, production emails shipped
// links like `http://localhost:3000/feedback` — recipients clicked "Share My
// Experience" and landed on nothing. It also made docs pages disagree with
// every other page about its own canonical origin.
//
// RULE: no module outside this file may build an absolute first-party URL by
// hand. Import `appUrl()` / `siteUrl()` (or the origin constants) instead.
//
// TWO ORIGINS, ON PURPOSE
// -----------------------
//   APP_ORIGIN  – the origin that actually serves authenticated routes
//                 (/dashboard, /settings, /feedback, /groups/invite/*).
//                 This is the only origin registered in the Google OAuth
//                 console, so it is the correct target for any link a signed-in
//                 (or soon-to-be-signed-in) user must follow: /login bounces
//                 non-primary origins here and bridges the session back.
//   SITE_ORIGIN – the public, indexable marketing origin. Canonical tags,
//                 Open Graph URLs, sitemap.xml, robots.txt and llms.txt must
//                 all point here, otherwise the same page is announced under
//                 two different domains and SEO splits.
//
// See lib/origins.ts for the CORS/CSRF allowlist and the cross-origin auth
// bridge topology.

const DEFAULT_APP_ORIGIN = "https://money-spend-tracker.vercel.app";
const DEFAULT_SITE_ORIGIN = "https://thespendwise.vercel.app";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

/**
 * Reduces any user-supplied/env-supplied string to a bare origin
 * (`scheme://host[:port]`) with no trailing slash, or null if unusable.
 */
function toOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function isLoopback(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".local");
  } catch {
    return false;
  }
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Resolves the origin that serves authenticated app routes.
 *
 * `NEXTAUTH_URL` is deliberately NOT consulted in production. It is an auth
 * callback base, not a public site URL, and it is the exact value that caused
 * localhost links to leak into outbound email. It is honoured in development
 * only, so `next dev` and the test suite still produce localhost links.
 */
export function resolveAppOrigin(): string {
  const explicit =
    toOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    toOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN);

  if (explicit) return explicit;

  if (!isProductionEnv()) {
    const devUrl = toOrigin(process.env.NEXTAUTH_URL);
    if (devUrl && isLoopback(devUrl)) return devUrl;
  }

  return DEFAULT_APP_ORIGIN;
}

/**
 * Resolves the public, indexable marketing origin used for SEO surfaces.
 *
 * Accepts either env var name so the SEO surfaces and the CORS allowlist in
 * lib/origins.ts can never disagree about which host is the marketing site.
 */
export function resolveSiteOrigin(): string {
  return (
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    toOrigin(process.env.NEXT_PUBLIC_PRODUCTION_LINK) ??
    toOrigin(process.env.NEXT_PUBLIC_MARKETING_ORIGIN) ??
    DEFAULT_SITE_ORIGIN
  );
}

/**
 * Eagerly-resolved origins, for the few call sites that need a bare origin at
 * module scope (Next.js `metadataBase`, Open Graph `url`).
 *
 * Prefer `appUrl()` / `siteUrl()` everywhere else: they re-resolve on every
 * call, so a test (or any runtime env change) that sets an env var after this
 * module is first imported is still honoured.
 */
export const APP_ORIGIN = resolveAppOrigin();

/** Public indexable marketing origin. No trailing slash. */
export const SITE_ORIGIN = resolveSiteOrigin();

/**
 * Joins a path onto an origin without producing a double slash.
 * `appUrl()` with no path returns the bare origin.
 */
function join(origin: string, path: string): string {
  if (!path) return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Absolute URL for an authenticated app route.
 *
 * appUrl("/dashboard")  -> "https://money-spend-tracker.vercel.app/dashboard"
 * appUrl("/api/unsubscribe?email=a%40b.c") -> ".../api/unsubscribe?email=a%40b.c"
 *
 * Use this for anything a signed-in user clicks: dashboard, settings,
 * feedback, group invitations, unsubscribe.
 */
export function appUrl(path = ""): string {
  return join(resolveAppOrigin(), path);
}

/**
 * Absolute URL for a public, indexable marketing page.
 *
 * siteUrl("/features") -> "https://thespendwise.vercel.app/features"
 *
 * Use this for canonical URLs, Open Graph URLs, JSON-LD `url` fields,
 * sitemap.xml entries, robots.txt and llms.txt.
 */
export function siteUrl(path = ""): string {
  return join(resolveSiteOrigin(), path);
}

/**
 * True when a resolved first-party origin is a loopback address while running
 * in production — the signature of a misconfigured deployment that would ship
 * `http://localhost:3000/...` links to real users.
 */
export function hasLocalhostOriginLeak(): boolean {
  return (
    isProductionEnv() &&
    (isLoopback(resolveAppOrigin()) || isLoopback(resolveSiteOrigin()))
  );
}
