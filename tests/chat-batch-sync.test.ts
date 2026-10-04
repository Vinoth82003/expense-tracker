import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { monthKeyOf, splitByMonth, mergeById, SYNC_EVENTS } from "@/lib/chat/batchSync";

const root = join(process.cwd());
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("monthKeyOf", () => {
  it("formats a date as YYYY-MM", () => {
    expect(monthKeyOf("2026-03-15")).toBe("2026-03");
    expect(monthKeyOf(new Date(2026, 10, 3))).toBe("2026-11");
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
    const source = read("context/UserContext.tsx");
    for (const event of SYNC_EVENTS) {
      expect(source).toContain(`addEventListener("${event}"`);
      expect(source).toContain(`removeEventListener("${event}"`);
    }
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