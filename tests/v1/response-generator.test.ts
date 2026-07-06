import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  generateGreeting,
  generateExpenseSummary,
  generateBudgetStatus,
  generateTrend,
  generateOutOfScope,
  generateUnknown,
} from "@/lib/chat/v1/response-generator";

describe("Response Generator Tests", () => {
  it("formats currency in Indian Rupees format", () => {
    // Note: Vitest output might format spaces or specific currency symbols based on Node version locale details,
    // so we can test if it contains '₹' and correct digit groupings.
    const val = formatCurrency(1250.5);
    expect(val).toContain("1,250.50");
    expect(val).toContain("₹");
  });

  it("formats percentages correctly", () => {
    expect(formatPercent(75.23)).toBe("75.2%");
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("generates a warm greeting message", () => {
    const greeting = generateGreeting();
    expect(greeting.length).toBeGreaterThan(10);
    expect(
      greeting.includes("Sage") || 
      greeting.includes("Hi there") || 
      greeting.includes("Hello") || 
      greeting.includes("Greetings")
    ).toBe(true);
  });

  it("generates an expense summary properly", () => {
    const summary = generateExpenseSummary(
      "this month",
      5000,
      [
        { category: "Food", total: 3000 },
        { category: "Transport", total: 2000 },
      ],
      "Try to cook at home to save money."
    );
    expect(summary).toContain("this month");
    expect(summary).toContain("Food");
    expect(summary).toContain("Transport");
    expect(summary).toContain("Try to cook at home");
  });

  it("generates budget status overview properly", () => {
    const status = generateBudgetStatus(10000, 7500, 75, 2500, "caution limit approaching", "⚠️");
    expect(status).toContain("10,000");
    expect(status).toContain("7,500");
    expect(status).toContain("75");
    expect(status).toContain("2,500");
    expect(status).toContain("⚠️");
  });

  it("generates trend messages correctly", () => {
    const trendInc = generateTrend(12000, 10000, 2000, 20, "increased", "Spending is higher.");
    expect(trendInc).toContain("12,000");
    expect(trendInc).toContain("10,000");
    expect(trendInc).toContain("↑");
    expect(trendInc).toContain("increase");
    expect(trendInc).toContain("Spending is higher");

    const trendDec = generateTrend(8000, 10000, -2000, -20, "decreased");
    expect(trendDec).toContain("↓");
    expect(trendDec).toContain("decrease");
  });

  it("generates out of scope rejections correctly", () => {
    const oos = generateOutOfScope("money transfer");
    expect(oos).toContain("money transfer");
    expect(
      oos.includes("not able to help") || 
      oos.includes("cannot assist")
    ).toBe(true);
  });

  it("generates friendly fallbacks", () => {
    const fallback = generateUnknown();
    expect(fallback.length).toBeGreaterThan(10);
    expect(
      fallback.includes("summary") || 
      fallback.includes("budget") || 
      fallback.includes("catch that") || 
      fallback.includes("not sure")
    ).toBe(true);
  });
});
