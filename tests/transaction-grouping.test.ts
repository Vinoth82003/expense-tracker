import { describe, it, expect } from "vitest";
import {
  applyFilters,
  collectFacets,
  countActiveFilters,
  EMPTY_FILTERS,
  formatDayLabel,
  groupOptionsFor,
  groupTransactions,
  isFilterActive,
  sumAmount,
  toDayKey,
  type TransactionFilters,
  type TransactionLike,
} from "@/lib/transaction-grouping";

const expense = (
  over: Partial<TransactionLike> & { id: string }
): TransactionLike => ({
  amount: 100,
  note: null,
  date: "2026-03-10T10:00:00.000Z",
  category: "Needs",
  subcategory: "Rent",
  entrySource: "MANUAL",
  ...over,
});

const income = (
  over: Partial<TransactionLike> & { id: string }
): TransactionLike => ({
  amount: 1000,
  note: null,
  date: "2026-03-10T10:00:00.000Z",
  source: "Salary",
  entrySource: "MANUAL",
  ...over,
});

const filters = (over: Partial<TransactionFilters> = {}): TransactionFilters => ({
  ...EMPTY_FILTERS,
  ...over,
});

describe("toDayKey", () => {
  it("uses local calendar date, not UTC", () => {
    // A late-evening local time can be the next day in UTC; the day bucket must
    // follow the user's calendar, otherwise transactions land in the wrong day.
    const lateLocal = new Date(2026, 2, 10, 23, 30).toISOString();
    expect(toDayKey(lateLocal)).toBe("2026-03-10");
  });

  it("returns empty string for an unparseable date", () => {
    expect(toDayKey("not-a-date")).toBe("");
  });
});

describe("formatDayLabel", () => {
  it("labels today and yesterday relatively", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    expect(formatDayLabel(key(today))).toBe("Today");
    expect(formatDayLabel(key(yesterday))).toBe("Yesterday");
  });

  it("falls back to the raw key for a malformed date", () => {
    expect(formatDayLabel("garbage")).toBe("garbage");
  });
});

describe("groupTransactions", () => {
  it("groups expenses by day, newest first, with per-group totals", () => {
    const groups = groupTransactions(
      [
        expense({ id: "1", amount: 50, date: "2026-03-10T09:00:00.000Z" }),
        expense({ id: "2", amount: 70, date: "2026-03-10T18:00:00.000Z" }),
        expense({ id: "3", amount: 30, date: "2026-03-11T09:00:00.000Z" }),
      ],
      "date",
      "expense"
    );

    expect(groups.map((g) => g.key)).toEqual(["2026-03-11", "2026-03-10"]);
    expect(groups[1].count).toBe(2);
    expect(groups[1].total).toBe(120);
  });

  it("groups expenses by subcategory and sorts alphabetically", () => {
    const groups = groupTransactions(
      [
        expense({ id: "1", subcategory: "Travel" }),
        expense({ id: "2", subcategory: "Rent" }),
        expense({ id: "3", subcategory: "Rent", amount: 25 }),
      ],
      "subcategory",
      "expense"
    );

    expect(groups.map((g) => g.label)).toEqual(["Rent", "Travel"]);
    expect(groups[0].total).toBe(125);
    expect(groups[0].count).toBe(2);
  });

  it("groups expenses by source using the provenance label", () => {
    const groups = groupTransactions(
      [
        expense({ id: "1", entrySource: "MANUAL" }),
        expense({ id: "2", entrySource: "SAGE" }),
        // A legacy row with no entrySource must read as "By you", not blank.
        expense({ id: "3", entrySource: undefined }),
      ],
      "source",
      "expense"
    );

    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.key === "By you")?.count).toBe(2);
    expect(groups.find((g) => g.key === "By Sage")?.count).toBe(1);
  });

  it("groups income by source using the income origin, not provenance", () => {
    const groups = groupTransactions(
      [
        income({ id: "1", source: "Salary" }),
        income({ id: "2", source: "Freelance", entrySource: "SAGE" }),
        income({ id: "3", source: "Salary" }),
      ],
      "source",
      "income"
    );

    expect(groups.map((g) => g.label)).toEqual(["Freelance", "Salary"]);
    expect(groups.find((g) => g.label === "Salary")?.count).toBe(2);
  });

  it("labels missing values rather than emitting empty groups", () => {
    const groups = groupTransactions(
      [expense({ id: "1", category: undefined })],
      "category",
      "expense"
    );
    expect(groups[0].label).toBe("Uncategorised");
  });

  it("buckets malformed dates together instead of colliding with a real day", () => {
    const groups = groupTransactions(
      [
        expense({ id: "1", date: "2026-03-10T09:00:00.000Z" }),
        expense({ id: "2", date: "garbage" }),
      ],
      "date",
      "expense"
    );
    expect(groups).toHaveLength(2);
    expect(groups.some((g) => g.key === "undated")).toBe(true);
  });

  it("returns an empty array for no items", () => {
    expect(groupTransactions([], "date", "expense")).toEqual([]);
  });
});

describe("applyFilters", () => {
  const rows = [
    expense({ id: "1", amount: 100, note: "Rent for March", subcategory: "Rent" }),
    expense({ id: "2", amount: 250, note: "Flight", subcategory: "Travel", category: "Wants", entrySource: "SAGE" }),
    income({ id: "3", amount: 5000, source: "Salary", date: "2026-03-15T09:00:00.000Z" }),
  ];

  it("matches search across note, category, subcategory, source and amount", () => {
    expect(applyFilters(rows, filters({ search: "flight" })).map((r) => r.id)).toEqual(["2"]);
    expect(applyFilters(rows, filters({ search: "travel" })).map((r) => r.id)).toEqual(["2"]);
    expect(applyFilters(rows, filters({ search: "5000" })).map((r) => r.id)).toEqual(["3"]);
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    expect(applyFilters(rows, filters({ search: "  RENT " })).map((r) => r.id)).toEqual(["1"]);
  });

  it("filters by category and subcategory", () => {
    expect(applyFilters(rows, filters({ categories: ["Wants"] })).map((r) => r.id)).toEqual(["2"]);
    expect(applyFilters(rows, filters({ subcategories: ["Rent"] })).map((r) => r.id)).toEqual(["1"]);
  });

  it("treats multi-select within one facet as OR", () => {
    expect(
      applyFilters(rows, filters({ categories: ["Needs", "Wants"] })).map((r) => r.id)
    ).toEqual(["1", "2"]);
  });

  it("combines different facets with AND", () => {
    expect(
      applyFilters(rows, filters({ categories: ["Wants"], entrySources: ["SAGE"] })).map(
        (r) => r.id
      )
    ).toEqual(["2"]);
    expect(
      applyFilters(rows, filters({ categories: ["Wants"], entrySources: ["MANUAL"] }))
    ).toHaveLength(0);
  });

  it("filters by provenance and treats a legacy row as MANUAL", () => {
    expect(applyFilters(rows, filters({ entrySources: ["MANUAL"] })).map((r) => r.id)).toEqual(["1", "3"]);
    expect(applyFilters(rows, filters({ entrySources: ["SAGE"] })).map((r) => r.id)).toEqual(["2"]);
  });

  it("filters by income source", () => {
    expect(applyFilters(rows, filters({ sources: ["Salary"] })).map((r) => r.id)).toEqual(["3"]);
  });

  it("applies inclusive amount bounds", () => {
    expect(applyFilters(rows, filters({ minAmount: 100, maxAmount: 250 })).map((r) => r.id)).toEqual(["1", "2"]);
    expect(applyFilters(rows, filters({ minAmount: 101 })).map((r) => r.id)).toEqual(["2", "3"]);
  });

  it("applies inclusive date bounds without excluding same-day late entries", () => {
    expect(applyFilters(rows, filters({ fromDate: "2026-03-10", toDate: "2026-03-10" })).map((r) => r.id)).toEqual(["1", "2"]);
    expect(applyFilters(rows, filters({ fromDate: "2026-03-11" })).map((r) => r.id)).toEqual(["3"]);
  });

  it("returns everything for empty filters", () => {
    expect(applyFilters(rows, filters())).toHaveLength(3);
  });
});

describe("filter state helpers", () => {
  it("detects an inactive filter set", () => {
    expect(isFilterActive(EMPTY_FILTERS)).toBe(false);
    expect(isFilterActive(filters({ search: "   " }))).toBe(false);
    expect(isFilterActive(filters({ minAmount: 0 }))).toBe(true);
  });

  it("counts active facets, collapsing amount and date into one each", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters(filters({ search: "x", categories: ["a", "b"] }))).toBe(3);
    expect(countActiveFilters(filters({ minAmount: 1, maxAmount: 2 }))).toBe(1);
    expect(countActiveFilters(filters({ fromDate: "2026-03-01", toDate: "2026-03-31" }))).toBe(1);
  });
});

describe("collectFacets", () => {
  it("collects sorted distinct values from the loaded data", () => {
    const facets = collectFacets([
      expense({ id: "1", category: "Wants", subcategory: "Travel" }),
      expense({ id: "2", category: "Needs", subcategory: "Rent" }),
      expense({ id: "3", category: "Needs", subcategory: "Rent", entrySource: "SAGE" }),
      income({ id: "4", source: "Salary", category: undefined, subcategory: undefined }),
    ]);

    expect(facets.categories).toEqual(["Needs", "Wants"]);
    expect(facets.subcategories).toEqual(["Rent", "Travel"]);
    expect(facets.sources).toEqual(["Salary"]);
    // Always both, so the user can filter to "nothing was entered by Sage".
    expect(facets.entrySources).toEqual(["MANUAL", "SAGE"]);
  });
});

describe("groupOptionsFor", () => {
  it("offers every axis for expenses", () => {
    expect(groupOptionsFor("expense").map((o) => o.value)).toEqual([
      "date",
      "category",
      "source",
      "subcategory",
    ]);
  });

  it("omits category and subcategory for income, which has neither", () => {
    expect(groupOptionsFor("income").map((o) => o.value)).toEqual(["date", "source"]);
  });
});

describe("sumAmount", () => {
  it("totals correctly and handles empty input", () => {
    expect(sumAmount([expense({ id: "1", amount: 10 }), expense({ id: "2", amount: 5.5 })])).toBe(15.5);
    expect(sumAmount([])).toBe(0);
  });
});