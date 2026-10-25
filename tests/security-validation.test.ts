import { describe, it, expect } from "vitest";
import {
  normalizeIpOrCidr,
  parseBlockExpiry,
  validateReason,
  isIpInRange,
  MIN_IPV4_PREFIX,
  type ValidationResult,
} from "../lib/admin/security-validation";

function okValue<T>(r: ValidationResult<T>): T {
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error}`);
  return r.value;
}

function errText<T>(r: ValidationResult<T>): string {
  if (r.ok) throw new Error("expected an error, got ok");
  return r.error;
}

describe("normalizeIpOrCidr", () => {
  it("accepts a valid IPv4 address", () => {
    const result = normalizeIpOrCidr("192.168.1.1");
    expect(result.ok).toBe(true);
    expect(okValue(result)).toBe("192.168.1.1");
  });

  it("trims surrounding whitespace", () => {
    expect(okValue(normalizeIpOrCidr("  10.0.0.1  "))).toBe("10.0.0.1");
  });

  it("accepts a reasonably sized IPv4 CIDR range", () => {
    const result = normalizeIpOrCidr("203.0.113.0/24");
    expect(result.ok).toBe(true);
    expect(okValue(result)).toBe("203.0.113.0/24");
  });

  it("rejects an over-broad IPv4 range", () => {
    const result = normalizeIpOrCidr("0.0.0.0/0");
    expect(result.ok).toBe(false);
    expect(errText(result)).toContain(`minimum /${MIN_IPV4_PREFIX}`);
  });

  it("rejects malformed addresses", () => {
    expect(normalizeIpOrCidr("999.1.1.1").ok).toBe(false);
    expect(normalizeIpOrCidr("not-an-ip").ok).toBe(false);
    expect(normalizeIpOrCidr("1.2.3").ok).toBe(false);
    expect(normalizeIpOrCidr("").ok).toBe(false);
    expect(normalizeIpOrCidr(undefined).ok).toBe(false);
  });

  it("rejects a CIDR prefix outside the valid range", () => {
    expect(normalizeIpOrCidr("10.0.0.0/33").ok).toBe(false);
    expect(normalizeIpOrCidr("10.0.0.0/abc").ok).toBe(false);
  });

  it("rejects an over-broad IPv6 range", () => {
    expect(normalizeIpOrCidr("2001:db8::/16").ok).toBe(false);
  });
});

describe("isIpInRange", () => {
  it("matches an exact address", () => {
    expect(isIpInRange("10.0.0.5", "10.0.0.5")).toBe(true);
    expect(isIpInRange("10.0.0.6", "10.0.0.5")).toBe(false);
  });

  it("matches an address inside a CIDR block", () => {
    expect(isIpInRange("10.0.0.5", "10.0.0.0/24")).toBe(true);
    expect(isIpInRange("10.0.1.5", "10.0.0.0/24")).toBe(false);
  });

  it("treats /0 as matching everything", () => {
    expect(isIpInRange("8.8.8.8", "0.0.0.0/0")).toBe(true);
  });

  it("returns false for incompatible address families", () => {
    expect(isIpInRange("2001:db8::1", "10.0.0.0/24")).toBe(false);
  });
});

describe("parseBlockExpiry", () => {
  it("treats empty values as no expiry", () => {
    expect(parseBlockExpiry(undefined)).toEqual({ ok: true, value: null });
    expect(parseBlockExpiry("")).toEqual({ ok: true, value: null });
    expect(parseBlockExpiry(null)).toEqual({ ok: true, value: null });
  });

  it("parses a duration shorthand into a future date", () => {
    const result = parseBlockExpiry("7d");
    expect(result.ok).toBe(true);
    expect(okValue(result)).toBeInstanceOf(Date);
    expect(okValue(result)!.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a past date", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(parseBlockExpiry(past).ok).toBe(false);
  });

  it("rejects absurdly long durations", () => {
    expect(parseBlockExpiry("400d").ok).toBe(false);
  });

  it("rejects junk input", () => {
    expect(parseBlockExpiry("soon").ok).toBe(false);
  });
});

describe("validateReason", () => {
  it("requires a minimum length", () => {
    expect(validateReason("ab").ok).toBe(false);
    expect(validateReason("abc").ok).toBe(true);
  });

  it("trims and rejects non-strings", () => {
    expect(okValue(validateReason("  verified  "))).toBe("verified");
    expect(validateReason(42).ok).toBe(false);
    expect(validateReason(undefined).ok).toBe(false);
  });

  it("caps the maximum length", () => {
    expect(validateReason("x".repeat(501)).ok).toBe(false);
  });
});
