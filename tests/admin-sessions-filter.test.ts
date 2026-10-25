import { describe, it, expect } from "vitest";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  buildLoginWhere,
  buildOtpWhere,
  buildSessionWhere,
  deriveSessionStatus,
  maskEmail,
  parseSessionListQuery,
} from "../lib/admin/sessions-filter";

describe("parseSessionListQuery", () => {
  it("applies safe defaults", () => {
    const q = parseSessionListQuery(new URLSearchParams());
    expect(q.search).toBe("");
    expect(q.status).toBeNull();
    expect(q.method).toBeNull();
    expect(q.userId).toBeNull();
    expect(q.from).toBeNull();
    expect(q.to).toBeNull();
    expect(q.page).toBe(1);
    expect(q.limit).toBe(DEFAULT_LIMIT);
    expect(q.dateInvalid).toBe(false);
  });

  it("trims search and treats All as no status", () => {
    expect(parseSessionListQuery(new URLSearchParams("search=  ada  ")).search).toBe("ada");
    expect(parseSessionListQuery(new URLSearchParams("status=All")).status).toBeNull();
    expect(parseSessionListQuery(new URLSearchParams("status=FAILED")).status).toBe("FAILED");
  });

  it("flags an invalid date and clamps paging", () => {
    expect(parseSessionListQuery(new URLSearchParams("from=not-a-date")).dateInvalid).toBe(true);
    const q = parseSessionListQuery(new URLSearchParams("page=0&limit=9999"));
    expect(q.page).toBe(1);
    expect(q.limit).toBe(MAX_LIMIT);
  });

  it("parses valid date bounds", () => {
    const q = parseSessionListQuery(new URLSearchParams("from=2026-01-01&to=2026-02-01"));
    expect(q.dateInvalid).toBe(false);
    expect(q.from).toBeInstanceOf(Date);
    expect(q.to).toBeInstanceOf(Date);
  });
});

describe("buildOtpWhere", () => {
  const base = parseSessionListQuery(new URLSearchParams());

  it("is empty by default", () => {
    expect(buildOtpWhere(base)).toEqual({});
  });

  it("applies a whitelisted status only", () => {
    expect(buildOtpWhere({ ...base, status: "FAILED" }).status).toBe("FAILED");
    expect(buildOtpWhere({ ...base, status: "HACKED" }).status).toBeUndefined();
  });

  it("searches email, ip and user name", () => {
    const where = buildOtpWhere({ ...base, search: "ada" });
    expect(where.OR).toHaveLength(3);
  });

  it("applies the date range", () => {
    const where = buildOtpWhere({ ...base, from: new Date("2026-01-01"), to: new Date("2026-02-01") });
    expect((where.createdAt as { gte?: Date }).gte).toBeInstanceOf(Date);
  });
});

describe("buildLoginWhere", () => {
  const base = parseSessionListQuery(new URLSearchParams());

  it("applies status, method and user id", () => {
    const where = buildLoginWhere({ ...base, status: "BLOCKED", method: "google", userId: "abc" });
    expect(where.status).toBe("BLOCKED");
    expect(where.method).toBe("google");
    expect(where.userId).toBe("abc");
  });

  it("ignores a non-whitelisted status", () => {
    expect(buildLoginWhere({ ...base, status: "NOPE" }).status).toBeUndefined();
  });
});

describe("buildSessionWhere", () => {
  const base = parseSessionListQuery(new URLSearchParams());

  it("applies user id and search", () => {
    const where = buildSessionWhere({ ...base, userId: "abc", search: "10." });
    expect(where.userId).toBe("abc");
    expect(where.OR).toHaveLength(5);
  });
});

describe("deriveSessionStatus", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("marks a future expiry active", () => {
    expect(deriveSessionStatus(new Date("2026-06-01T01:00:00Z"), now)).toBe("active");
  });

  it("marks a past expiry expired", () => {
    expect(deriveSessionStatus(new Date("2026-05-31T23:00:00Z"), now)).toBe("expired");
    expect(deriveSessionStatus("not-a-date", now)).toBe("expired");
  });
});

describe("maskEmail", () => {
  it("keeps the domain and first/last of a long local part", () => {
    expect(maskEmail("jane.doe@example.com")).toBe("j***e@example.com");
  });

  it("collapses short and malformed addresses", () => {
    expect(maskEmail("ab@example.com")).toBe("a***@example.com");
    expect(maskEmail("no-at-sign")).toBe("***");
  });
});
