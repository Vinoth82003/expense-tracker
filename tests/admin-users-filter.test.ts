import { describe, it, expect } from "vitest";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  buildUsersWhere,
  parseUserListQuery,
} from "../lib/admin/users-filter";

describe("parseUserListQuery", () => {
  it("applies safe defaults", () => {
    const q = parseUserListQuery(new URLSearchParams());
    expect(q.search).toBe("");
    expect(q.twoFA).toBeNull();
    expect(q.mode).toBeNull();
    expect(q.joined).toBeNull();
    expect(q.page).toBe(1);
    expect(q.limit).toBe(DEFAULT_LIMIT);
    expect(q.sortBy).toBe("createdAt");
    expect(q.sortOrder).toBe("desc");
  });

  it("trims the search term", () => {
    expect(parseUserListQuery(new URLSearchParams("search=  ada  ")).search).toBe("ada");
  });

  it("falls back to createdAt for an unknown sort column", () => {
    expect(parseUserListQuery(new URLSearchParams("sortBy=password")).sortBy).toBe("createdAt");
  });

  it("accepts a whitelisted sort column and ascending order", () => {
    const q = parseUserListQuery(new URLSearchParams("sortBy=email&sortOrder=asc"));
    expect(q.sortBy).toBe("email");
    expect(q.sortOrder).toBe("asc");
  });

  it("clamps the page and limit into range", () => {
    const q = parseUserListQuery(new URLSearchParams("page=0&limit=99999"));
    expect(q.page).toBe(1);
    expect(q.limit).toBe(MAX_LIMIT);

    const negative = parseUserListQuery(new URLSearchParams("page=-5&limit=0"));
    expect(negative.page).toBe(1);
    expect(negative.limit).toBe(1);
  });

  it("ignores non-numeric paging values", () => {
    const q = parseUserListQuery(new URLSearchParams("page=abc&limit=xyz"));
    expect(q.page).toBe(1);
    expect(q.limit).toBe(DEFAULT_LIMIT);
  });
});

describe("buildUsersWhere", () => {
  const empty = { search: "", twoFA: null, mode: null, joined: null };

  it("returns an empty filter when nothing is set", () => {
    expect(buildUsersWhere(empty)).toEqual({});
  });

  it("matches name or email for a search term", () => {
    expect(buildUsersWhere({ ...empty, search: "ada" })).toEqual({
      OR: [
        { name: { contains: "ada", mode: "insensitive" } },
        { email: { contains: "ada", mode: "insensitive" } },
      ],
    });
  });

  it("maps the 2FA filter to a boolean", () => {
    expect(buildUsersWhere({ ...empty, twoFA: "Enabled" }).twoFactorEnabled).toBe(true);
    expect(buildUsersWhere({ ...empty, twoFA: "Disabled" }).twoFactorEnabled).toBe(false);
    expect(buildUsersWhere({ ...empty, twoFA: "All" }).twoFactorEnabled).toBeUndefined();
  });

  it("maps the mode filter, treating Unset as null", () => {
    expect(buildUsersWhere({ ...empty, mode: "Limit" }).expenseMode).toBe("limit");
    expect(buildUsersWhere({ ...empty, mode: "No-limit" }).expenseMode).toBe("no-limit");
    expect(buildUsersWhere({ ...empty, mode: "Unset" }).expenseMode).toBeNull();
    expect(buildUsersWhere({ ...empty, mode: "All" }).expenseMode).toBeUndefined();
  });

  it("constrains joined dates for recent windows", () => {
    const seven = buildUsersWhere({ ...empty, joined: "Last 7d" });
    const thirty = buildUsersWhere({ ...empty, joined: "Last 30d" });
    expect(seven.createdAt).toBeDefined();
    expect(thirty.createdAt).toBeDefined();
    const sevenGte = (seven.createdAt as { gte: Date }).gte.getTime();
    const thirtyGte = (thirty.createdAt as { gte: Date }).gte.getTime();
    expect(sevenGte).toBeGreaterThan(thirtyGte);
    expect(buildUsersWhere({ ...empty, joined: "All time" }).createdAt).toBeUndefined();
  });
});
