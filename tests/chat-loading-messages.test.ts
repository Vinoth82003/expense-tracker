import { describe, expect, it } from "vitest";

import {
  ALL_PROCESSING_MESSAGES,
  PROCESSING_PREAMBLE,
  PROCESSING_STEPS,
  buildProcessingTimeline,
  detectProcessingIntent,
} from "@/lib/chat/loading-messages";

/**
 * The old indicator showed one of two fixed strings ("Understanding that..."
 * / "Analyzing your data...") on a hardcoded timer. The replacement narrates
 * what the current request is actually doing, so these tests pin the routing:
 * a transaction must never be narrated as a report, and a query must never be
 * narrated as a write.
 */
describe("detectProcessingIntent", () => {
  it.each([
    ["Spent ₹1,200 on groceries today.", "expense"],
    ["spent 500 on food", "expense"],
    ["paid ₹250 for a taxi", "expense"],
    ["bought a coffee for 60", "expense"],
  ])("routes %s to expense", (message, expected) => {
    expect(detectProcessingIntent(message)).toBe(expected);
  });

  it.each([
    ["Got my salary of ₹45,000 today.", "income"],
    ["received 2000 as a gift", "income"],
    ["earned 5000 from freelance work", "income"],
  ])("routes %s to income", (message, expected) => {
    expect(detectProcessingIntent(message)).toBe(expected);
  });

  it.each([
    ["Set my monthly budget to ₹25,000.", "budget"],
    ["update my monthly budget to 30000", "budget"],
    ["how is my budget this month?", "budget"],
  ])("routes %s to budget", (message, expected) => {
    expect(detectProcessingIntent(message)).toBe(expected);
  });

  it.each([
    ["How much did I spend this month?", "insight"],
    ["Show me my expenses for this month.", "insight"],
    ["Give me my financial insights.", "insight"],
    ["Compare this month vs last month.", "insight"],
  ])("routes %s to insight", (message, expected) => {
    expect(detectProcessingIntent(message)).toBe(expected);
  });

  it("prefers a transaction over the generic word 'spend'", () => {
    // "spent" appears in both a report question and a write; the amount decides.
    expect(detectProcessingIntent("how much did I spend?")).toBe("insight");
    expect(detectProcessingIntent("I spent 300 at the market")).toBe("expense");
  });

  it("prefers the explicit budget verb over a bare budget mention", () => {
    expect(detectProcessingIntent("what is my budget")).toBe("budget");
  });

  it("defaults to insight for an empty or unrecognised message", () => {
    expect(detectProcessingIntent("")).toBe("insight");
    expect(detectProcessingIntent("hello")).toBe("insight");
  });
});

describe("buildProcessingTimeline", () => {
  it("always starts with the preamble", () => {
    const timeline = buildProcessingTimeline("spent 500 on food");
    expect(timeline[0]).toBe(PROCESSING_PREAMBLE);
  });

  it("returns more than one line so the wait reads as progress", () => {
    // A single static line is what made the old indicator feel stalled.
    expect(buildProcessingTimeline("spent 500 on food").length).toBeGreaterThan(1);
  });

  it("uses the steps matching the detected intent", () => {
    const timeline = buildProcessingTimeline("spent 500 on food");
    expect(timeline.slice(1)).toEqual(PROCESSING_STEPS.expense);
  });

  it("swaps the narration for a query", () => {
    const timeline = buildProcessingTimeline("How much did I spend this month?");
    expect(timeline.slice(1)).toEqual(PROCESSING_STEPS.insight);
  });

  it("honours the caller's cap so a slow response cannot run past the reply", () => {
    const timeline = buildProcessingTimeline("spent 500 on food", 2);
    expect(timeline).toHaveLength(3);
  });

  it("handles a zero cap without producing a bare preamble-only array of nulls", () => {
    expect(buildProcessingTimeline("spent 500 on food", 0)).toEqual([PROCESSING_PREAMBLE]);
  });

  it("never renders an empty or duplicate-preamble line", () => {
    for (const message of ["spent 500 on food", "got 45000 salary", "set budget to 25000", "how much did I spend?"]) {
      const timeline = buildProcessingTimeline(message);
      for (const line of timeline) {
        expect(line.trim().length).toBeGreaterThan(0);
      }
      expect(timeline.filter((l) => l === PROCESSING_PREAMBLE)).toHaveLength(1);
    }
  });
});

describe("message catalogue", () => {
  it("gives every intent at least one step", () => {
    for (const steps of Object.values(PROCESSING_STEPS)) {
      expect(steps.length).toBeGreaterThan(0);
    }
  });

  it("keeps the flat catalogue free of duplicates", () => {
    expect(new Set(ALL_PROCESSING_MESSAGES).size).toBe(ALL_PROCESSING_MESSAGES.length);
  });
});