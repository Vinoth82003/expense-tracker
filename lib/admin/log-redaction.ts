/**
 * Defensive redaction for system-log payloads.
 *
 * Logs are written by many subsystems and may accidentally capture secrets
 * (tokens, cookies, OTPs, SMTP credentials). The admin console renders this
 * data, so it is sanitized at the API boundary: sensitive keys are replaced and
 * every string is length-capped so a hostile/huge payload cannot blow up the UI.
 */

const SENSITIVE_KEY = /pass|pwd|secret|token|authorization|auth|cookie|apikey|api_key|otp|code|hash|credential/i;
const REDACTED = "[redacted]";
const MAX_STRING = 500;
const MAX_DEPTH = 6;

function capString(value: string): string {
  return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[truncated]` : value;
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return capString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactValue(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactValue(val, depth + 1);
    }
    return out;
  }
  return String(value);
}

/**
 * Redacts a log `details` field, which may be raw JSON or free text.
 * Returns a JSON string; malformed JSON is returned as a capped plain string.
 */
export function redactDetails(details: string | null): string | null {
  if (details === null || details === undefined) return details;
  const trimmed = details.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.stringify(redactValue(JSON.parse(trimmed)));
    } catch {
      return capString(details);
    }
  }
  return capString(details);
}
