export type EntitlementStatus =
  | "ok"
  | "unauthenticated"
  | "suspended"
  | "two_factor_required";

export interface EntitlementUser {
  id?: string;
  isSuspended?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorVerifiedAt?: Date | string | null;
}

export interface EntitlementDecision {
  status: EntitlementStatus;
  userId?: string;
  reason?: string | null;
}

const OK: EntitlementDecision = { status: "ok" };

// How long a completed 2FA challenge keeps granting access. The OTP itself is
// single-use and short-lived; this is the window for the already-issued session.
export const TWO_FACTOR_GRANT_MS = 12 * 60 * 60 * 1000;

function isTwoFactorSatisfied(
  user: EntitlementUser,
  now: number = Date.now()
): boolean {
  if (!user.twoFactorEnabled) return true;
  if (!user.twoFactorVerifiedAt) return false;

  const verifiedAt = new Date(user.twoFactorVerifiedAt).getTime();
  if (Number.isNaN(verifiedAt)) return false;

  return now - verifiedAt < TWO_FACTOR_GRANT_MS;
}

export function evaluateEntitlement(
  user: EntitlementUser | null | undefined,
  now: number = Date.now()
): EntitlementDecision {
  if (!user || !user.id) {
    return { status: "unauthenticated" };
  }

  if (user.isSuspended) {
    return { status: "suspended", userId: user.id };
  }

  if (!isTwoFactorSatisfied(user, now)) {
    return { status: "two_factor_required", userId: user.id };
  }

  return { ...OK, userId: user.id };
}

const STATUS_TO_HTTP: Record<EntitlementStatus, number> = {
  ok: 200,
  unauthenticated: 401,
  suspended: 403,
  two_factor_required: 403,
};

const STATUS_TO_CODE: Record<EntitlementStatus, string> = {
  ok: "OK",
  unauthenticated: "UNAUTHENTICATED",
  suspended: "ACCOUNT_SUSPENDED",
  two_factor_required: "TWO_FACTOR_REQUIRED",
};

export function entitlementHttpStatus(status: EntitlementStatus): number {
  return STATUS_TO_HTTP[status];
}

export function entitlementCode(status: EntitlementStatus): string {
  return STATUS_TO_CODE[status];
}

export function denialMessage(status: EntitlementStatus): string {
  switch (status) {
    case "suspended":
      return "Your account is suspended. Contact support for assistance.";
    case "two_factor_required":
      return "Two-factor verification is required for this account.";
    case "unauthenticated":
      return "Unauthorized";
    default:
      return "OK";
  }
}

// Paths that must stay reachable while the user still owes a 2FA challenge or
// while they have been suspended (so they can read/act on that state).
export const ENTITLEMENT_EXEMPT_PREFIXES = [
  "/api/2fa",
  "/api/auth",
  "/api/login",
  "/api/logout",
  "/api/admin",
  "/verify-2fa",
  "/login",
  "/maintenance",
  "/status",
  "/api/health",
  "/api/contact",
  "/api/feedback",
  "/api/reviews",
  "/api/status",
  "/api/user/suspend",
];

export function isEntitlementExempt(pathname: string): boolean {
  return ENTITLEMENT_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
