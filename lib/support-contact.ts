// Single source of truth for public support contact details.
//
// UI (contact page, FAQ CTAs), page metadata and JSON-LD must all read the
// same values. Hardcoding the address in one surface and env-driving another
// is how schema and visible content drift apart.
//
// Env:
//   NEXT_PUBLIC_SUPPORT_EMAIL  – public support mailbox (falls back to the
//                                historical default when unset).
//   NEXT_PUBLIC_SUPPORT_PHONE  – optional public phone. When unset, phone is
//                                omitted from UI and structured data rather
//                                than inventing a number.

/** Fallback when NEXT_PUBLIC_SUPPORT_EMAIL is unset. Prefer env in production. */
export const DEFAULT_SUPPORT_EMAIL = "support@spendwise.app";

/** Trimmed public support email. Never empty. */
export function resolveSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return fromEnv || DEFAULT_SUPPORT_EMAIL;
}

/**
 * Optional public phone from NEXT_PUBLIC_SUPPORT_PHONE.
 * Returns null when unset/blank so callers can omit the channel entirely.
 */
export function resolveSupportPhone(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  return fromEnv || null;
}

/** `tel:` href for a phone string, or null when there is no phone. */
export function supportPhoneHref(phone: string | null): string | null {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
