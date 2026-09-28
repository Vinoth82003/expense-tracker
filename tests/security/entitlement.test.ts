import { describe, it, expect } from "vitest";
import {
  evaluateEntitlement,
  isEntitlementExempt,
  entitlementHttpStatus,
  entitlementCode,
  denialMessage,
  TWO_FACTOR_GRANT_MS,
} from "@/lib/user-entitlement";
import { verifyOtp, hashOtp, generateOtp } from "@/lib/otp";
import {
  getClientIp,
  getUserAgent,
  getClientIpFromHeaders,
} from "@/lib/request-meta";
import { describeBrowser, describeDevice } from "@/lib/user-agent";

// lib/otp.ts refuses to hash without a server-side pepper. next-auth requires
// NEXTAUTH_SECRET in every real environment, so the test env provides one.
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "test-only-secret-for-otp-pepper";

describe("SEC-01 / SEC-02: server-side entitlement gate", () => {
  const base = { id: "u1", isSuspended: false, twoFactorEnabled: false };

  it("allows a normal user", () => {
    const d = evaluateEntitlement(base);
    expect(d.status).toBe("ok");
    expect(d.userId).toBe("u1");
  });

  it("treats a missing session as unauthenticated", () => {
    expect(evaluateEntitlement(null).status).toBe("unauthenticated");
    expect(evaluateEntitlement(undefined).status).toBe("unauthenticated");
    expect(evaluateEntitlement({}).status).toBe("unauthenticated");
  });

  // SEC-02: a suspended account must be refused server-side, not just dimmed
  // by a client overlay.
  it("refuses a suspended user even though the token is still valid", () => {
    const d = evaluateEntitlement({ ...base, isSuspended: true });
    expect(d.status).toBe("suspended");
  });

  it("checks suspension before 2FA", () => {
    const d = evaluateEntitlement({
      id: "u1",
      isSuspended: true,
      twoFactorEnabled: true,
      twoFactorVerifiedAt: null,
    });
    expect(d.status).toBe("suspended");
  });

  // SEC-01: 2FA must be required until a challenge is actually completed.
  it("requires 2FA when enabled but never verified", () => {
    const d = evaluateEntitlement({ ...base, twoFactorEnabled: true });
    expect(d.status).toBe("two_factor_required");
  });

  it("requires 2FA when verifiedAt is explicitly null", () => {
    const d = evaluateEntitlement({
      ...base,
      twoFactorEnabled: true,
      twoFactorVerifiedAt: null,
    });
    expect(d.status).toBe("two_factor_required");
  });

  it("allows 2FA-enabled user who verified recently", () => {
    const d = evaluateEntitlement({
      ...base,
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date(),
    });
    expect(d.status).toBe("ok");
  });

  it("re-locks access once the verification window has lapsed", () => {
    const stale = new Date(Date.now() - TWO_FACTOR_GRANT_MS - 1000);
    const d = evaluateEntitlement({
      ...base,
      twoFactorEnabled: true,
      twoFactorVerifiedAt: stale,
    });
    expect(d.status).toBe("two_factor_required");
  });

  it("rejects an unparseable verification timestamp rather than trusting it", () => {
    const d = evaluateEntitlement({
      ...base,
      twoFactorEnabled: true,
      twoFactorVerifiedAt: "not-a-date",
    });
    expect(d.status).toBe("two_factor_required");
  });

  it("accepts an ISO string timestamp (as it arrives over the session)", () => {
    const d = evaluateEntitlement({
      ...base,
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date().toISOString(),
    });
    expect(d.status).toBe("ok");
  });

  it("does not require 2FA for users who never enabled it", () => {
    const d = evaluateEntitlement({ ...base, twoFactorEnabled: false });
    expect(d.status).toBe("ok");
  });

  it("maps denial statuses onto stable HTTP codes and error codes", () => {
    expect(entitlementHttpStatus("suspended")).toBe(403);
    expect(entitlementHttpStatus("two_factor_required")).toBe(403);
    expect(entitlementHttpStatus("unauthenticated")).toBe(401);
    expect(entitlementCode("suspended")).toBe("ACCOUNT_SUSPENDED");
    expect(entitlementCode("two_factor_required")).toBe("TWO_FACTOR_REQUIRED");
    expect(denialMessage("suspended")).toMatch(/suspended/i);
  });
});

describe("entitlement exemptions", () => {
  it("keeps the 2FA challenge reachable while verification is outstanding", () => {
    // Without this the user could never satisfy the gate they are being sent to.
    expect(isEntitlementExempt("/api/2fa/verify")).toBe(true);
    expect(isEntitlementExempt("/api/2fa/send")).toBe(true);
    expect(isEntitlementExempt("/api/2fa/toggle")).toBe(true);
    expect(isEntitlementExempt("/verify-2fa")).toBe(true);
  });

  it("keeps auth endpoints and public pages reachable", () => {
    expect(isEntitlementExempt("/api/auth/callback/credentials")).toBe(true);
    expect(isEntitlementExempt("/login")).toBe(true);
    expect(isEntitlementExempt("/status")).toBe(true);
  });

  it("does NOT exempt protected app data", () => {
    expect(isEntitlementExempt("/api/expenses")).toBe(false);
    expect(isEntitlementExempt("/api/groups")).toBe(false);
    expect(isEntitlementExempt("/dashboard")).toBe(false);
  });

  it("does not exempt on a mere prefix lookalike", () => {
    // "/api/2fa-evil" must not slip through on the "/api/2fa" prefix.
    expect(isEntitlementExempt("/api/2faevil/verify")).toBe(false);
  });
});

describe("SEC-09: OTP hashing", () => {
  it("never verifies against plaintext storage", () => {
    // A legacy plaintext row must not be treated as a valid code.
    expect(verifyOtp("123456", "123456")).toBe(false);
  });

  it("verifies a code against its HMAC and rejects a wrong one", () => {
    const otp = generateOtp();
    const stored = hashOtp(otp);
    expect(verifyOtp(otp, stored)).toBe(true);
    expect(verifyOtp("000000", stored)).toBe(false);
  });

  it("produces a 32-byte digest, not a bare 6-digit code", () => {
    const stored = hashOtp("123456");
    expect(stored).toHaveLength(64);
    expect(stored).not.toBe("123456");
  });

  it("returns false for missing or malformed stored values", () => {
    expect(verifyOtp("123456", null)).toBe(false);
    expect(verifyOtp("123456", "")).toBe(false);
    expect(verifyOtp("123456", "zzzz")).toBe(false);
  });

  it("generates a 6-digit numeric code", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });

  it("does not verify the same code against a different code's hash", () => {
    const a = generateOtp();
    const b = generateOtp();
    expect(verifyOtp(b, hashOtp(a))).toBe(false);
  });
});

describe("SEC-10: real request metadata instead of placeholders", () => {
  it("takes the first x-forwarded-for hop", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1, 10.0.0.2" });
    expect(getClientIp(h)).toBe("203.0.113.9");
  });

  it("falls back through the other proxy headers", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(getClientIp(new Headers({ "cf-connecting-ip": "198.51.100.8" }))).toBe(
      "198.51.100.8"
    );
  });

  it("reports 'unknown' rather than a fake address when nothing is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
    expect(getClientIp(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
  });

  it("captures the user agent and nulls when absent", () => {
    expect(getUserAgent(new Headers({ "user-agent": "Mozilla/5.0 (Macintosh)" }))).toBe(
      "Mozilla/5.0 (Macintosh)"
    );
    expect(getUserAgent(new Headers())).toBeNull();
  });

  it("reads from a plain header record", () => {
    expect(
      getClientIpFromHeaders({ "x-forwarded-for": "203.0.113.5", "x-real-ip": undefined })
    ).toBe("203.0.113.5");
  });

  it("classifies common browsers and devices for the audit trail", () => {
    expect(describeBrowser("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0")).toMatch(
      /Chrome 120/
    );
    expect(describeBrowser("Mozilla/5.0 (Macintosh) Version/17.0 Safari/605")).toMatch(
      /Safari 17/
    );
    expect(describeBrowser(null)).toBe("Unknown");
    expect(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("iOS");
    expect(describeDevice("Mozilla/5.0 (Linux; Android 14; Mobile)")).toBe("Android Mobile");
    expect(describeDevice(null)).toBe("Unknown");
  });
});
