import { describe, it, expect } from "vitest";
import {
  buildSessionWhere,
  deriveSessionStatus,
  parseSessionListQuery,
  MAX_SEARCH_LENGTH,
} from "../lib/admin/sessions-filter";

describe("admin-sessions-filter", () => {
  describe("buildSessionWhere", () => {
    describe("search filter", () => {
      it("creates case-insensitive OR predicates for user name, email, ip, device, and browser", () => {
        const where = buildSessionWhere({ search: "admin@example.com" });

        expect(where.OR).toEqual([
          { user: { is: { name: { contains: "admin@example.com", mode: "insensitive" } } } },
          { user: { is: { email: { contains: "admin@example.com", mode: "insensitive" } } } },
          { ip: { contains: "admin@example.com", mode: "insensitive" } },
          { device: { contains: "admin@example.com", mode: "insensitive" } },
          { browser: { contains: "admin@example.com", mode: "insensitive" } },
        ]);
      });

      it("trims search queries", () => {
        const where = buildSessionWhere({ search: "  Firefox  " });
        expect(where.OR?.[4]).toEqual({
          browser: { contains: "Firefox", mode: "insensitive" },
        });
      });

      it("ignores blank and whitespace searches", () => {
        expect(buildSessionWhere({ search: "" }).OR).toBeUndefined();
        expect(buildSessionWhere({ search: "   " }).OR).toBeUndefined();
        expect(buildSessionWhere({ search: null }).OR).toBeUndefined();
      });

      it("caps overly long search terms to MAX_SEARCH_LENGTH", () => {
        const longQuery = "a".repeat(500);
        const where = buildSessionWhere({ search: longQuery });
        const expected = "a".repeat(MAX_SEARCH_LENGTH);

        expect(where.OR?.[2]).toEqual({
          ip: { contains: expected, mode: "insensitive" },
        });
      });

      it("combines search with userId filter", () => {
        const where = buildSessionWhere({ userId: "u123", search: "192.168.1.1" });
        expect(where.userId).toBe("u123");
        expect(where.OR).toBeDefined();
      });
    });

    describe("date filtering", () => {
      it("applies from and to dates on createdAt", () => {
        const from = new Date("2026-01-01T00:00:00Z");
        const to = new Date("2026-01-31T23:59:59Z");
        const where = buildSessionWhere({ from, to });

        expect(where.createdAt?.gte).toEqual(from);
        expect(where.createdAt?.lte).toEqual(to);
      });

      it("supports open-ended ranges", () => {
        const from = new Date("2026-01-01");
        const where = buildSessionWhere({ from });

        expect(where.createdAt?.gte).toEqual(from);
        expect(where.createdAt?.lte).toBeUndefined();
      });

      it("drops invalid dates rather than throwing", () => {
        const where = buildSessionWhere({ from: "invalid-date", to: "" });
        expect(where.createdAt).toBeUndefined();
      });
    });

    describe("status filtering", () => {
      const fixedNow = new Date("2026-05-01T12:00:00Z");

      it("filters for active sessions where expires > now", () => {
        const where = buildSessionWhere({ status: "active" }, fixedNow);
        expect(where.expires).toEqual({ gt: fixedNow });
      });

      it("filters for expired sessions where expires <= now", () => {
        const where = buildSessionWhere({ status: "expired" }, fixedNow);
        expect(where.expires).toEqual({ lte: fixedNow });
      });

      it("ignores status 'All'", () => {
        const where = buildSessionWhere({ status: "All" }, fixedNow);
        expect(where.expires).toBeUndefined();
      });
    });

    it("returns an empty object when no filters are set", () => {
      expect(buildSessionWhere({})).toEqual({});
    });
  });

  describe("deriveSessionStatus", () => {
    const fixedNow = new Date("2026-05-01T12:00:00Z");

    it("returns 'active' when expiry is after now", () => {
      const future = new Date("2026-05-01T13:00:00Z");
      expect(deriveSessionStatus(future, fixedNow)).toBe("active");
    });

    it("returns 'expired' when expiry is in the past", () => {
      const past = new Date("2026-05-01T11:00:00Z");
      expect(deriveSessionStatus(past, fixedNow)).toBe("expired");
    });

    it("returns 'expired' when expiry is exactly now", () => {
      expect(deriveSessionStatus(fixedNow, fixedNow)).toBe("expired");
    });

    it("returns 'expired' for invalid date values", () => {
      expect(deriveSessionStatus("invalid", fixedNow)).toBe("expired");
      expect(deriveSessionStatus(null, fixedNow)).toBe("expired");
      expect(deriveSessionStatus(undefined, fixedNow)).toBe("expired");
    });
  });

  describe("parseSessionListQuery", () => {
    it("provides defaults for pagination and flags dateInvalid as false", () => {
      const query = parseSessionListQuery(new URLSearchParams());
      expect(query.page).toBe(1);
      expect(query.limit).toBe(25);
      expect(query.search).toBeNull();
      expect(query.dateInvalid).toBe(false);
    });

    it("parses valid page, limit, and search parameters", () => {
      const params = new URLSearchParams({
        page: "3",
        limit: "50",
        search: " test user ",
      });
      const query = parseSessionListQuery(params);
      expect(query.page).toBe(3);
      expect(query.limit).toBe(50);
      expect(query.search).toBe("test user");
    });

    it("flags dateInvalid=true when from is invalid", () => {
      const params = new URLSearchParams({ from: "not-a-date" });
      const query = parseSessionListQuery(params);
      expect(query.dateInvalid).toBe(true);
    });

    it("flags dateInvalid=true when to is invalid", () => {
      const params = new URLSearchParams({ to: "bad-date" });
      const query = parseSessionListQuery(params);
      expect(query.dateInvalid).toBe(true);
    });

    it("flags dateInvalid=true when from date is after to date", () => {
      const params = new URLSearchParams({
        from: "2026-02-01",
        to: "2026-01-01",
      });
      const query = parseSessionListQuery(params);
      expect(query.dateInvalid).toBe(true);
    });

    it("parses valid date ranges without marking dateInvalid", () => {
      const params = new URLSearchParams({
        from: "2026-01-01",
        to: "2026-02-01",
      });
      const query = parseSessionListQuery(params);
      expect(query.dateInvalid).toBe(false);
      expect(query.from).toBeInstanceOf(Date);
      expect(query.to).toBeInstanceOf(Date);
    });
  });
});
