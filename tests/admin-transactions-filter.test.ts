import { describe, it, expect } from "vitest";
import {
  buildTransactionWhere,
  FLAGGED_THRESHOLD,
} from "../lib/admin/transactions-filter";

describe("buildTransactionWhere", () => {
  describe("search by user", () => {
    it("matches the user's name and email, case-insensitively", () => {
      const where = buildTransactionWhere({ search: "a@b.com" }, "expense");

      expect(where.user).toEqual({
        is: {
          OR: [
            { name: { contains: "a@b.com", mode: "insensitive" } },
            { email: { contains: "a@b.com", mode: "insensitive" } },
          ],
        },
      });
    });

    it("trims the search term", () => {
      expect(buildTransactionWhere({ search: "  Ada  " }, "expense").user).toEqual({
        is: {
          OR: [
            { name: { contains: "Ada", mode: "insensitive" } },
            { email: { contains: "Ada", mode: "insensitive" } },
          ],
        },
      });
    });

    it("ignores blank searches", () => {
      expect(buildTransactionWhere({ search: "   " }, "expense")).toEqual({});
      expect(buildTransactionWhere({ search: "" }, "expense")).toEqual({});
      expect(buildTransactionWhere({ search: null }, "expense")).toEqual({});
    });

    it("caps an absurdly long search term", () => {
      const where = buildTransactionWhere({ search: "x".repeat(500) }, "expense");
      const capped = "x".repeat(120);
      expect(where.user?.is.OR).toEqual([
        { name: { contains: capped, mode: "insensitive" } },
        { email: { contains: capped, mode: "insensitive" } },
      ]);
    });

    it("combines with other filters", () => {
      const where = buildTransactionWhere(
        { search: "ada", userId: "u1", category: "Wants" },
        "expense"
      );
      expect(where.userId).toBe("u1");
      expect(where.category).toBe("Wants");
      expect(where.user).toBeDefined();
    });
  });

  describe("category", () => {
    it("maps to `category` on expenses and `source` on income", () => {
      expect(buildTransactionWhere({ category: "Wants" }, "expense").category).toBe("Wants");
      expect(buildTransactionWhere({ category: "Wants" }, "income")).toEqual({ source: "Wants" });
    });

    it("ignores the 'All' sentinel and blanks", () => {
      expect(buildTransactionWhere({ category: "All" }, "expense")).toEqual({});
      expect(buildTransactionWhere({ category: "" }, "income")).toEqual({});
    });
  });

  describe("flagged", () => {
    it("filters in the database, not after pagination", () => {
      expect(buildTransactionWhere({ flagged: true }, "expense").amount).toEqual({
        gt: FLAGGED_THRESHOLD.expense,
      });
      expect(buildTransactionWhere({ flagged: true }, "income").amount).toEqual({
        gt: FLAGGED_THRESHOLD.income,
      });
    });

    it("omits the amount clause when not filtering", () => {
      expect(buildTransactionWhere({}, "expense").amount).toBeUndefined();
      expect(buildTransactionWhere({ flagged: false }, "expense").amount).toBeUndefined();
    });

    it("merges with the amount range instead of overwriting it", () => {
      const where = buildTransactionWhere(
        { flagged: true, minAmount: "100", maxAmount: "500" },
        "expense"
      );
      expect(where.amount).toEqual({
        gte: 100,
        lte: 500,
        gt: FLAGGED_THRESHOLD.expense,
      });
    });
  });

  describe("dates", () => {
    it("applies an open-ended range", () => {
      const where = buildTransactionWhere({ from: "2026-01-01" }, "expense");
      expect(where.date?.gte).toBeInstanceOf(Date);
      expect(where.date?.lte).toBeUndefined();
    });

    it("drops invalid dates rather than throwing", () => {
      expect(buildTransactionWhere({ from: "not-a-date" }, "expense")).toEqual({});
      expect(buildTransactionWhere({ to: "" }, "expense")).toEqual({});
    });
  });

  describe("amounts", () => {
    it("ignores non-numeric input", () => {
      expect(buildTransactionWhere({ minAmount: "abc" }, "expense")).toEqual({});
      expect(buildTransactionWhere({ maxAmount: "" }, "expense")).toEqual({});
    });

    it("accepts zero", () => {
      expect(buildTransactionWhere({ minAmount: "0" }, "expense").amount).toEqual({ gte: 0 });
    });
  });

  it("returns an empty clause when nothing is filtered", () => {
    expect(buildTransactionWhere({}, "expense")).toEqual({});
  });
});