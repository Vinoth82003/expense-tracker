import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  DEFAULT_SUPPORT_EMAIL,
  resolveSupportEmail,
  resolveSupportPhone,
  supportPhoneHref,
} from "@/lib/support-contact";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "NEXT_PUBLIC_SUPPORT_PHONE",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("support-contact", () => {
  it("uses NEXT_PUBLIC_SUPPORT_EMAIL when set", () => {
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "help@spendwise.app";
    expect(resolveSupportEmail()).toBe("help@spendwise.app");
  });

  it("trims whitespace from the email env var", () => {
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "  help@spendwise.app  ";
    expect(resolveSupportEmail()).toBe("help@spendwise.app");
  });

  it("falls back to the historical default when email env is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
    expect(resolveSupportEmail()).toBe(DEFAULT_SUPPORT_EMAIL);
  });

  it("returns null phone when NEXT_PUBLIC_SUPPORT_PHONE is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_PHONE", "");
    expect(resolveSupportPhone()).toBeNull();
  });

  it("returns the phone when set", () => {
    process.env.NEXT_PUBLIC_SUPPORT_PHONE = "+91 93844 60843";
    expect(resolveSupportPhone()).toBe("+91 93844 60843");
  });

  it("treats blank phone env as unset", () => {
    process.env.NEXT_PUBLIC_SUPPORT_PHONE = "   ";
    expect(resolveSupportPhone()).toBeNull();
  });

  it("builds a tel: href with dialable characters only", () => {
    expect(supportPhoneHref("+91 93844 60843")).toBe("tel:+919384460843");
    expect(supportPhoneHref(null)).toBeNull();
  });
});
