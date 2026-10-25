import { describe, expect, it } from "vitest";
import { findDuplicateGroups, normalizeCategoryName } from "@/lib/admin/category-dedupe";

describe("normalizeCategoryName", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeCategoryName("  Food   &  Dining  ")).toBe("food and dining");
  });

  it("treats & and 'and' as equivalent", () => {
    expect(normalizeCategoryName("Food & Dining")).toBe(normalizeCategoryName("Food and Dining"));
  });

  it("strips punctuation", () => {
    expect(normalizeCategoryName("Health-Care!")).toBe("health care");
  });

  it("returns an empty key for punctuation-only names", () => {
    expect(normalizeCategoryName("—")).toBe("");
  });
});

describe("findDuplicateGroups", () => {
  it("groups cosmetic variants of the same name", () => {
    const groups = findDuplicateGroups(["Food", "food", "FOOD"]);
    expect(groups).toHaveLength(1);
    expect(groups[0].normalized).toBe("food");
    expect(groups[0].names.sort()).toEqual(["FOOD", "Food", "food"].sort());
  });

  it("matches & against 'and'", () => {
    const groups = findDuplicateGroups(["Food & Dining", "Food and Dining"]);
    expect(groups).toHaveLength(1);
    expect(groups[0].names).toHaveLength(2);
  });

  it("does not flag distinct names", () => {
    expect(findDuplicateGroups(["Food", "Travel", "Rent"])).toEqual([]);
  });

  it("ignores blank/punctuation-only names", () => {
    expect(findDuplicateGroups(["", "  ", "—"])).toEqual([]);
  });

  it("sorts larger groups first", () => {
    const groups = findDuplicateGroups(["Food", "food", "FOOD", "Travel", "travel"]);
    expect(groups[0].names).toHaveLength(3);
    expect(groups[1].names).toHaveLength(2);
  });

  it("reports distinct spellings only once per group", () => {
    const groups = findDuplicateGroups(["Food", "Food"]);
    expect(groups).toEqual([]);
  });
});
