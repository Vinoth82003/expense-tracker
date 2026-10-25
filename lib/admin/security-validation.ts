/**
 * Validation helpers for the admin Security surface (spec 11).
 *
 * The blocklist previously accepted any string as an "IP", so a typo or an
 * over-broad range (e.g. `0.0.0.0/0`) could lock every user out with no warning.
 * These helpers reject malformed addresses and refuse accidentally broad CIDR
 * ranges before anything reaches the database.
 */

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const IPV4_RE =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

/** Loose but safe IPv6 check (hex groups, at most one `::`). */
const IPV6_RE = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * A single IPv4 host may be blocked freely. A CIDR block narrower than this is
 * almost always a mistake that would take a large slice of the internet offline.
 */
export const MIN_IPV4_PREFIX = 16;
export const MIN_IPV6_PREFIX = 48;

function isValidIpv4(ip: string): boolean {
  return IPV4_RE.test(ip);
}

function isValidIpv6(ip: string): boolean {
  return ip.includes(":") && IPV6_RE.test(ip);
}

/**
 * Normalises and validates a host IP or CIDR range. Returns the trimmed value
 * on success. Never throws.
 */
export function normalizeIpOrCidr(
  input: unknown
): ValidationResult<string> {
  if (typeof input !== "string" || input.trim().length === 0) {
    return { ok: false, error: "An IP address or CIDR range is required." };
  }

  const raw = input.trim();
  const slash = raw.indexOf("/");

  if (slash === -1) {
    if (isValidIpv4(raw) || isValidIpv6(raw)) return { ok: true, value: raw };
    return { ok: false, error: "Not a valid IPv4 or IPv6 address." };
  }

  const host = raw.slice(0, slash);
  const prefixStr = raw.slice(slash + 1);
  if (!/^\d{1,3}$/.test(prefixStr)) {
    return { ok: false, error: "CIDR prefix must be a number (e.g. /24)." };
  }
  const prefix = Number(prefixStr);

  if (isValidIpv4(host)) {
    if (prefix < 0 || prefix > 32) {
      return { ok: false, error: "IPv4 prefix must be between 0 and 32." };
    }
    if (prefix < MIN_IPV4_PREFIX) {
      return {
        ok: false,
        error: `Refusing to block a /${prefix} range — it would affect far too many addresses (minimum /${MIN_IPV4_PREFIX}).`,
      };
    }
    return { ok: true, value: `${host}/${prefix}` };
  }

  if (isValidIpv6(host)) {
    if (prefix < 0 || prefix > 128) {
      return { ok: false, error: "IPv6 prefix must be between 0 and 128." };
    }
    if (prefix < MIN_IPV6_PREFIX) {
      return {
        ok: false,
        error: `Refusing to block a /${prefix} IPv6 range — it is far too broad (minimum /${MIN_IPV6_PREFIX}).`,
      };
    }
    return { ok: true, value: `${host}/${prefix}` };
  }

  return { ok: false, error: "Not a valid IPv4 or IPv6 CIDR range." };
}

function ipv4ToInt(ip: string): number | null {
  if (!isValidIpv4(ip)) return null;
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

/**
 * True when `ip` falls inside `range` (a single address or an IPv4 CIDR).
 * Used for the self-lockout guard. IPv6 comparisons are best-effort only.
 */
export function isIpInRange(ip: string, range: string): boolean {
  const cleanIp = ip.trim();
  const cleanRange = range.trim();

  if (isValidIpv4(cleanIp) && isValidIpv4(cleanRange)) {
    return cleanIp === cleanRange;
  }

  const slash = cleanRange.indexOf("/");
  if (slash === -1) return cleanIp === cleanRange;

  const host = cleanRange.slice(0, slash);
  const prefix = Number(cleanRange.slice(slash + 1));
  const ipInt = ipv4ToInt(cleanIp);
  const hostInt = ipv4ToInt(host);
  if (ipInt === null || hostInt === null || !Number.isFinite(prefix)) return false;

  if (prefix === 0) return true;
  const mask = prefix === 32 ? 0xffffffff : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (hostInt & mask);
}

const MAX_BLOCK_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Parses an optional expiry. Accepts an ISO date, or a duration shorthand such
 * as `1h`, `7d`, `30d`. Empty/undefined means "no expiry" (permanent block).
 * Rejects dates in the past and absurdly distant dates.
 */
export function parseBlockExpiry(input: unknown): ValidationResult<Date | null> {
  if (input === undefined || input === null || input === "") {
    return { ok: true, value: null };
  }

  if (typeof input !== "string") {
    return { ok: false, error: "Expiry must be a date or a duration like 7d." };
  }

  const value = input.trim();
  const duration = /^(\d{1,4})\s*(h|d)$/i.exec(value);
  let expiresAt: Date;

  if (duration) {
    const amount = Number(duration[1]);
    const unitMs = duration[2].toLowerCase() === "h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const ms = amount * unitMs;
    if (ms <= 0 || ms > MAX_BLOCK_DURATION_MS) {
      return { ok: false, error: "Block duration must be between 1 hour and 365 days." };
    }
    expiresAt = new Date(Date.now() + ms);
  } else {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Expiry must be a valid date or a duration like 7d." };
    }
    if (parsed.getTime() <= Date.now()) {
      return { ok: false, error: "Expiry must be in the future." };
    }
    if (parsed.getTime() - Date.now() > MAX_BLOCK_DURATION_MS) {
      return { ok: false, error: "Expiry cannot be more than 365 days away." };
    }
    expiresAt = parsed;
  }

  return { ok: true, value: expiresAt };
}

/** A reason is mandatory for every sensitive security mutation. */
export function validateReason(
  input: unknown,
  { min = 3, max = 500 }: { min?: number; max?: number } = {}
): ValidationResult<string> {
  if (typeof input !== "string" || input.trim().length < min) {
    return { ok: false, error: `A reason (at least ${min} characters) is required.` };
  }
  const value = input.trim();
  if (value.length > max) {
    return { ok: false, error: `Reason must be under ${max} characters.` };
  }
  return { ok: true, value };
}
