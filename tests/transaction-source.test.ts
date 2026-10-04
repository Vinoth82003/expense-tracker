import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ENTRY_SOURCE,
  ENTRY_SOURCE_LABELS,
  getEntrySourceLabel,
  normalizeEntrySource,
} from "@/lib/transaction-source";
import { resolveEntrySource } from "@/lib/transaction-source.server";

const SECRET = "test-internal-secret";

const internalRequest = (userId: string, secret: string = SECRET) =>
  new Request("http://localhost/api/expenses", {
    method: "POST",
    headers: {
      "x-internal-user-id": userId,
      "x-internal-api-secret": secret,
    },
  });

describe("normalizeEntrySource", () => {
  it("passes through valid values", () => {
    expect(normalizeEntrySource("MANUAL")).toBe(ENTRY_SOURCE.MANUAL);
    expect(normalizeEntrySource("SAGE")).toBe(ENTRY_SOURCE.SAGE);
  });

  it("falls back to MANUAL for legacy, empty and bogus values", () => {
    for (const value of [undefined, null, "", "manual", "sage", "ASSISTANT", 42, {}]) {
      expect(normalizeEntrySource(value)).toBe(ENTRY_SOURCE.MANUAL);
    }
  });
});

describe("getEntrySourceLabel", () => {
  it("uses the user-facing labels", () => {
    expect(getEntrySourceLabel(ENTRY_SOURCE.MANUAL)).toBe("By you");
    expect(getEntrySourceLabel(ENTRY_SOURCE.SAGE)).toBe("By Sage");
  });

  it("never returns an empty label", () => {
    expect(getEntrySourceLabel(undefined)).toBe(ENTRY_SOURCE_LABELS.MANUAL);
  });
});

describe("resolveEntrySource", () => {
  const originalSecret = process.env.INTERNAL_API_SECRET;

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = originalSecret;
  });

  it("marks a verified internal Sage call as SAGE", () => {
    expect(resolveEntrySource(internalRequest("user-1"))).toBe(ENTRY_SOURCE.SAGE);
  });

  it("marks a plain browser write as MANUAL", () => {
    const browser = new Request("http://localhost/api/expenses", {
      method: "POST",
      headers: { cookie: "session=abc" },
    });
    expect(resolveEntrySource(browser)).toBe(ENTRY_SOURCE.MANUAL);
  });

  it("does not trust an internal claim with a wrong secret", () => {
    expect(resolveEntrySource(internalRequest("user-1", "guessed"))).toBe(
      ENTRY_SOURCE.MANUAL
    );
  });

  it("does not trust an internal claim missing the user id", () => {
    const noUser = new Request("http://localhost/api/expenses", {
      method: "POST",
      headers: { "x-internal-api-secret": SECRET },
    });
    expect(resolveEntrySource(noUser)).toBe(ENTRY_SOURCE.MANUAL);
  });

  it("does not trust an internal claim when no secret is configured", () => {
    delete process.env.INTERNAL_API_SECRET;
    process.env.NEXTAUTH_SECRET = "";
    expect(resolveEntrySource(internalRequest("user-1"))).toBe(ENTRY_SOURCE.MANUAL);
  });

  it("ignores an entrySource supplied by the caller", () => {
    // A browser posting entrySource:"SAGE" has no internal header, so it is MANUAL.
    const spoof = new Request("http://localhost/api/expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 10, entrySource: "SAGE" }),
    });
    expect(resolveEntrySource(spoof)).toBe(ENTRY_SOURCE.MANUAL);
  });
});