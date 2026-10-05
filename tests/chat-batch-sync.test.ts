import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  monthKeyOf,
  normalizeSyncPayload,
  splitByMonth,
  mergeById,
  SYNC_EVENTS,
} from "@/lib/chat/batchSync";

const root = join(process.cwd());
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("monthKeyOf", () => {
  it("formats a date as YYYY-MM", () => {
    expect(monthKeyOf("2026-03-15")).toBe("2026-03");
    expect(monthKeyOf(new Date(2026, 10, 3))).toBe("2026-11");
  });

  it("returns an empty string for an unparseable date", () => {
    // Not "NaN-NaN": a caller must be able to tell "outside the tracked months"
    // from "this record landed", which is how a dropped write stayed silent.
    expect(monthKeyOf(undefined as unknown as string)).toBe("");
    expect(monthKeyOf("not-a-date")).toBe("");
  });
});

/**
 * Regression guard for the "Sage adds a transaction but the context lags"
 * bug.
 *
 * The event NAME does not describe the payload. `batch-executor.ts` emits
 * `expenseAdded` for a single-expense message while still sending the full
 * `{ expenses[], incomes[], budget }` envelope, and `lib/chat/server.ts` sends
 * the bare row under that same name. The old per-event handlers each assumed
 * their own shape, so `expenseAdded` + envelope meant `detail.date === undefined`
 * → merged nothing → the write only became visible after a cache-invalidated
 * re-fetch. Normalizing first makes that combination impossible.
 */
describe("normalizeSyncPayload", () => {
  const expense = { id: "e1", amount: 250, date: "2026-10-04", category: "Needs" };
  const income = { id: "i1", amount: 900, date: "2026-10-04", source: "Salary" };

  it("reads a bare row under expenseAdded (legacy + v2 engine shape)", () => {
    expect(normalizeSyncPayload("expenseAdded", expense)).toEqual({
      expenses: [expense],
      incomes: [],
    });
  });

  it("reads a bare row under incomeAdded", () => {
    expect(normalizeSyncPayload("incomeAdded", income)).toEqual({
      expenses: [],
      incomes: [income],
    });
  });

  it("reads the batch envelope even when the event is expenseAdded", () => {
    // The exact case that used to be dropped on the floor.
    expect(
      normalizeSyncPayload("expenseAdded", {
        expenses: [expense],
        incomes: [],
        budget: null,
        operations: [{ kind: "EXPENSE" }],
      })
    ).toEqual({ expenses: [expense], incomes: [] });
  });

  it("reads the batch envelope under the single-record event names", () => {
    const envelope = { expenses: [], incomes: [income], budget: null };
    expect(normalizeSyncPayload("incomeAdded", envelope)).toEqual({
      expenses: [],
      incomes: [income],
    });
  });

  it("reads a multi-transaction batch under batchTransactionsAdded", () => {
    const envelope = { expenses: [expense], incomes: [income], budget: null };
    expect(normalizeSyncPayload("batchTransactionsAdded", envelope)).toEqual({
      expenses: [expense],
      incomes: [income],
    });
  });

  it("reads the budget document under budgetUpdated", () => {
    expect(
      normalizeSyncPayload("budgetUpdated", { id: "b1", month: "2026-10", amount: 30000 })
    ).toEqual({ expenses: [], incomes: [], budgetAmount: 30000 });
  });

  it("reads the legacy { limit, expenseMode } budget payload", () => {
    expect(
      normalizeSyncPayload("budgetUpdated", { limit: 12000, expenseMode: "limit" })
    ).toEqual({ expenses: [], incomes: [], budgetAmount: 12000, expenseMode: "limit" });
  });

  it("reads the budget inside a batch envelope", () => {
    expect(
      normalizeSyncPayload("batchTransactionsAdded", {
        expenses: [expense],
        incomes: [],
        budget: { amount: 8000 },
      })
    ).toEqual({ expenses: [expense], incomes: [], budgetAmount: 8000 });
  });

  it("never mistakes a budget document for a transaction", () => {
    // Both carry `amount`; only the transaction carries `date`. A budget sent
    // under the wrong event name yields nothing to apply, which the caller reads
    // as "re-read the server" rather than as a silently dropped write.
    expect(
      normalizeSyncPayload("expenseAdded", { id: "b1", month: "2026-10", amount: 30000 })
    ).toBeNull();
  });

  it("returns null when there is nothing usable to apply", () => {
    // null is the signal to re-read from the server rather than silently no-op.
    expect(normalizeSyncPayload("expenseAdded", undefined)).toBeNull();
    expect(normalizeSyncPayload("expenseAdded", null)).toBeNull();
    expect(normalizeSyncPayload("budgetUpdated", { month: "2026-10" })).toBeNull();
    expect(normalizeSyncPayload("expenseAdded", "nonsense")).toBeNull();
    expect(normalizeSyncPayload("batchTransactionsAdded", {})).toBeNull();
  });

  it("drops non-object members from the envelope arrays", () => {
    const out = normalizeSyncPayload("batchTransactionsAdded", {
      expenses: [expense, null, "junk"],
      incomes: [],
    });
    expect(out?.expenses).toEqual([expense]);
  });
});

describe("splitByMonth", () => {
  const now = new Date(2026, 9, 3); // Oct 2026

  it("routes records into this month, last month, or drops them", () => {
    const { current, previous } = splitByMonth(
      [
        { id: "a", date: "2026-10-01" },
        { id: "b", date: "2026-09-30" },
        { id: "c", date: "2026-06-01" },
      ],
      now,
    );

    expect(current.map((x) => x.id)).toEqual(["a"]);
    expect(previous.map((x) => x.id)).toEqual(["b"]);
    // Two months back is outside the tracked window.
    expect([...current, ...previous].map((x) => x.id)).not.toContain("c");
  });

  it("handles a year boundary", () => {
    const jan = new Date(2026, 0, 15);
    const { current, previous } = splitByMonth(
      [
        { id: "cur", date: "2026-01-10" },
        { id: "prev", date: "2025-12-31" },
      ],
      jan,
    );
    expect(current.map((x) => x.id)).toEqual(["cur"]);
    expect(previous.map((x) => x.id)).toEqual(["prev"]);
  });

  it("returns empty buckets for an empty input", () => {
    expect(splitByMonth([], new Date(2026, 9, 3))).toEqual({
      current: [],
      previous: [],
    });
  });
});

describe("mergeById", () => {
  const row = (id: string, date: string) => ({ id, date });

  it("prepends new records", () => {
    const out = mergeById([row("old", "2026-10-01")], [row("new", "2026-10-05")]);
    expect(out.map((x) => x.id)).toEqual(["new", "old"]);
  });

  it("drops ids already present instead of duplicating", () => {
    const existing = [row("a", "2026-10-01")];
    const out = mergeById(existing, [row("a", "2026-10-01"), row("b", "2026-10-09")]);
    expect(out.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("keeps the list sorted newest first", () => {
    const out = mergeById(
      [row("a", "2026-10-01"), row("b", "2026-10-20")],
      [row("c", "2026-10-10")],
    );
    expect(out.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("returns the same array reference when nothing is new", () => {
    const existing = [row("a", "2026-10-01")];
    expect(mergeById(existing, [])).toBe(existing);
    expect(mergeById(existing, [row("a", "2026-10-01")])).toBe(existing);
  });
});

/**
 * Regression guard: the chat route dispatches one of these event names after a
 * successful write, and a UI surface that never subscribes shows stale totals
 * until a manual refresh. That was the actual bug — Sage emits
 * `batchTransactionsAdded` for any multi-transaction message, but only the
 * single-record events were being listened for.
 */
describe("chat sync event contract", () => {
  const eventUnionFrom = (source: string): string[] => {
    const match = source.match(/eventType\?:\s*([^;]+);/);
    if (!match) return [];
    return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  };

  it("executor and types agree on the emitted event names", () => {
    const executor = eventUnionFrom(read("lib/chat/v2/batch-executor.ts"));
    const types = eventUnionFrom(read("lib/chat/types.ts"));
    expect(executor.length).toBeGreaterThan(0);
    expect(new Set(types)).toEqual(new Set(executor));
  });

  it("batch event is part of the public event set", () => {
    expect(SYNC_EVENTS).toContain("batchTransactionsAdded");
  });

  it("UserContext subscribes to every emitted event", () => {
    // One listener per name, registered by iterating SYNC_EVENTS — so a new
    // event name cannot be added to the route and quietly go unhandled.
    const source = read("context/UserContext.tsx");
    expect(source).toContain("SYNC_EVENTS.map((name) => {");
    expect(source).toContain("window.addEventListener(name, handler)");
    expect(source).toContain("window.removeEventListener(name, handler)");
  });

  it("UserContext normalizes the payload before merging", () => {
    const source = read("context/UserContext.tsx");
    expect(source).toContain("normalizeSyncPayload(e.type,");
  });

  it("UserContext has no per-event payload assumptions left", () => {
    // The old handlers read `detail.date` / `detail.limit` straight off the
    // event payload, which is exactly what broke on the batch envelope.
    const source = read("context/UserContext.tsx");
    expect(source).not.toContain("const handleExpenseAdded");
    expect(source).not.toContain("const handleIncomeAdded");
    expect(source).not.toContain("const handleBudgetUpdated");
    expect(source).not.toContain("const handleBatchTransactionsAdded");
  });

  it("reports page subscribes to every emitted event", () => {
    const source = read("app/(authenticated)/reports/page.tsx");
    for (const event of SYNC_EVENTS) {
      expect(source).toContain(`addEventListener('${event}'`);
      expect(source).toContain(`removeEventListener('${event}'`);
    }
  });

  it("ChatPanel dispatches the event name returned by the route", () => {
    const source = read("components/chat/ChatPanel.tsx");
    expect(source).toContain("dispatchSyncEvent");
    expect(source).toMatch(/eventType/);
  });
});