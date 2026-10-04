import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CacheStore,
  cacheKey,
  expenseListKey,
  incomeListKey,
  matchPrefix,
} from "@/context/DataContext";

const root = join(process.cwd());
const read = (p: string) => readFileSync(join(root, p), "utf8");

/**
 * The pages under test render from DataContext's cache, while chat/Sage writes
 * land in UserContext. Without an invalidation signal the list pages kept
 * showing the pre-write snapshot until a manual refresh. These tests pin the
 * notification contract that makes mounted consumers refetch.
 */
describe("cache invalidation notifications", () => {
  it("does not notify on write, so a subscriber cannot re-trigger its own fetch", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.set("expenses::2026-10", { expenses: [] }, 30_000);

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies with the exact key on delete", () => {
    const store = new CacheStore();
    store.set("expenses::2026-10", { expenses: [] }, 30_000);
    const listener = vi.fn();
    store.subscribe(listener);

    store.delete("expenses::2026-10");

    expect(listener).toHaveBeenCalledWith("expenses::2026-10");
    expect(store.get("expenses::2026-10")).toBeNull();
  });

  it("notifies with the prefix on deleteMatching, even when nothing was cached", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    store.subscribe(listener);

    // Nothing cached: the signal still has to fire, otherwise a mounted hook
    // that already rendered from a fetch would never learn to refetch.
    store.deleteMatching("expenses");

    expect(listener).toHaveBeenCalledWith("expenses");
  });

  it("notifies '*' on clear so every consumer revalidates", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.clear();

    expect(listener).toHaveBeenCalledWith("*");
  });

  it("does not notify on a ttl sweep — eviction is not a data change", () => {
    const store = new CacheStore();
    store.set("expenses::2026-10", { expenses: [] }, -1);
    const listener = vi.fn();
    store.subscribe(listener);

    store.sweep();

    expect(listener).not.toHaveBeenCalled();
    expect(store.get("expenses::2026-10")).toBeNull();
  });

  it("stops notifying after unsubscribe", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    unsub();
    store.delete("groups");

    expect(listener).not.toHaveBeenCalled();
  });

  it("a write followed by an invalidation notifies exactly once", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.set("expenses::2026-10", { expenses: [1] }, 30_000);
    store.delete("expenses::2026-10");

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("prefix matching reaches the list hooks", () => {
  it("treats a bare domain name as covering its month-scoped keys", () => {
    expect(matchPrefix(expenseListKey("2026-10"), "expenses")).toBe(true);
    expect(matchPrefix(incomeListKey("2026-10"), "income")).toBe(true);
  });

  it("does not cross domain boundaries", () => {
    expect(matchPrefix(incomeListKey("2026-10"), "expenses")).toBe(false);
    expect(matchPrefix(expenseListKey("2026-10"), "income")).toBe(false);
  });

  it("does not match on a bare string prefix that is not a key segment", () => {
    expect(matchPrefix("expensesarchive::2026", "expenses")).toBe(false);
  });

  it("matches an exact key", () => {
    expect(matchPrefix("categories", "categories")).toBe(true);
    expect(matchPrefix(cacheKey("group", "7"), "group::7")).toBe(true);
  });
});

/**
 * Source-level guard for the regression itself: the sync handlers used to patch
 * only UserContext's local lists, so the dashboard updated while /expenses and
 * /income kept rendering stale cache.
 */
describe("chat sync handlers invalidate the shared cache", () => {
  const handlerBody = (source: string, name: string): string => {
    const start = source.indexOf(`const ${name} = (e: Event) => {`);
    expect(start, `${name} not found`).toBeGreaterThan(-1);
    const end = source.indexOf("\n    };", start);
    return source.slice(start, end);
  };

  const source = read("context/UserContext.tsx");

  it("expenseAdded invalidates the expenses cache", () => {
    expect(handlerBody(source, "handleExpenseAdded")).toContain('invalidateMatching("expenses")');
  });

  it("incomeAdded invalidates the income cache", () => {
    expect(handlerBody(source, "handleIncomeAdded")).toContain('invalidateMatching("income")');
  });

  it("budgetUpdated invalidates the budget cache", () => {
    expect(handlerBody(source, "handleBudgetUpdated")).toContain('invalidateMatching("budget")');
  });

  it("batchTransactionsAdded invalidates every bucket it touched", () => {
    const body = handlerBody(source, "handleBatchTransactionsAdded");
    expect(body).toContain('if (expenses?.length) invalidateMatching("expenses")');
    expect(body).toContain('if (incomes?.length) invalidateMatching("income")');
    expect(body).toContain('invalidateMatching("budget")');
  });

  it("the sync effect depends on invalidateMatching", () => {
    expect(source).toContain("[session, fetchData, invalidateMatching]");
  });
});

describe("domain hooks revalidate on invalidation", () => {
  const source = read("context/DataContext.tsx");

  it("exposes the shared refresh helper", () => {
    expect(source).toContain("function useCacheRefresh(");
  });

  it("every subscriber-filtered hook is built on the helper", () => {
    // No hook may hand-roll a subscribe() callback again — that was how the
    // un-filtered, loop-prone variant got in.
    expect(source).not.toMatch(/subscribe\(\(\) => \{/);
  });

  it("each fetching effect depends on refresh", () => {
    const effects = source.match(/\}, \[[^\]]*refresh[^\]]*\]\);/g) ?? [];
    // useExpenses, useIncome, useCategories, useNotifications, useGroups,
    // useGroup, useSettings.
    expect(effects.length).toBeGreaterThanOrEqual(7);
  });

  it("the ttl sweep does not use the notifying clear", () => {
    expect(source).toMatch(/setInterval\([\s\S]{0,120}storeRef\.current\.sweep\(\)/);
  });
});