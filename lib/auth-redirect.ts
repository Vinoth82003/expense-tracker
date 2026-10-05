/**
 * Post-login redirect helpers.
 *
 * The middleware attaches the originally requested path to the `/login` redirect
 * as `?callbackUrl=`. That value is attacker-controllable (anyone can hand a
 * crafted link to a user), so it MUST be sanitised before it reaches
 * `router.push()` / next-auth's `callbackUrl` — otherwise the login page becomes
 * an open redirect.
 *
 * Only same-origin *app* paths are accepted. Everything else returns `null` so
 * callers fall back to their normal landing behaviour.
 */

/** Paths that must never be a post-login destination. */
const BLOCKED_PATH_PREFIXES = [
  "/admin", // separate HMAC-cookie auth system — a user session can't satisfy it
  "/api", // not a navigable page
  "/auth", // auth plumbing (bridge endpoints)
  "/bridge",
  "/login", // would loop straight back into the login page
];

// Control characters, newlines and raw spaces are never legitimate in a path we
// generate, and are the classic vector for header/URL parser confusion.
const ILLEGAL_CHARS = /[\u0000-\u0020\u007f]/;

export function sanitizeCallbackUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value.startsWith("/")) return null;

  // Protocol-relative ("//evil.com", "/\evil.com") and backslash variants are
  // treated as absolute URLs by browsers even though they start with a slash.
  if (value.startsWith("//") || value.startsWith("/\\")) return null;

  if (ILLEGAL_CHARS.test(value)) return null;

  // Compare on the path only — "/login?x" and "/login#y" must be blocked too.
  const path = value.split(/[?#]/, 1)[0].toLowerCase();
  if (!path || path === "/") return null;

  const isBlocked = BLOCKED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  if (isBlocked) return null;

  return value;
}