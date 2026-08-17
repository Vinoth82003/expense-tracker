// NOTE: "credit card" is intentionally NOT in the blacklist. It is a normal
// finance term (e.g. "paid my credit card bill today") and the word alone is not
// PII. Real card numbers are blocked by the 13-19 digit check below and any
// that slip through are redacted by lib/pii.ts:sanitizePii before reaching Groq.
const DEFAULT_BLACKLIST = ["kill", "attack", "bomb", "suicide", "hack", "ssn"];

function loadBlacklist(): string[] {
  const env = process?.env?.CHAT_MODERATION_BLACKLIST;
  if (!env) return DEFAULT_BLACKLIST;
  const trimmed = env.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      // fall through to comma-separated parsing
    }
  }
  return env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function moderateMessage(text: string): { allowed: boolean; reason?: string } {
  if (!text || text.trim().length === 0) return { allowed: false, reason: "empty" };
  const lowered = text.toLowerCase();
  const blacklist = loadBlacklist();
  for (const term of blacklist) {
    if (lowered.includes(term)) return { allowed: false, reason: `contains_${term}` };
  }
  // Basic length guard to avoid extremely long payloads
  if (text.length > 2000) return { allowed: false, reason: "too_long" };
  // Redact common sensitive patterns quickly (credit card-like digits, SSN-like patterns)
  if (/\b\d{13,19}\b/.test(text)) return { allowed: false, reason: "contains_long_numeric" };
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return { allowed: false, reason: "contains_ssn_like" };
  return { allowed: true };
}

export default moderateMessage;
