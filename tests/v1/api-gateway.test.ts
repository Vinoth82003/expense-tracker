import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiGateway from "@/lib/chat/v1/api-gateway";
import { getCategoryBreakdown, getWeekendSpending, getDailyAverage, getMonthOverMonth, getBudgetUtilization } from "@/lib/chat/v1/data-analyzer";

describe("Data Analyzer Unit Tests", () => {
  const sampleExpenses = [
    { id: "1", amount: 500, category: "Wants", subcategory: "Shopping", note: "Shoes", date: "2026-07-04T12:00:00.000Z" }, // Saturday
    { id: "2", amount: 300, category: "Needs", subcategory: "Food", note: "Lunch", date: "2026-07-05T12:00:00.000Z" },     // Sunday
    { id: "3", amount: 200, category: "Needs", subcategory: "Food", note: "Tea", date: "2026-07-06T12:00:00.000Z" },       // Monday
  ];

  it("calculates correct category breakdowns", () => {
    const breakdown = getCategoryBreakdown(sampleExpenses);
    expect(breakdown).toHaveLength(2);
    // Since Shopping is 500 and Food is 500, they are equal. Let's assert based on values.
    const foodCat = breakdown.find(b => b.category === "Food");
    const shopCat = breakdown.find(b => b.category === "Shopping");
    expect(foodCat?.total).toBe(500);
    expect(shopCat?.total).toBe(500);
    expect(foodCat?.percentage).toBe(50);
  });

  it("computes weekend spending totals", () => {
    const weekendSum = getWeekendSpending(sampleExpenses);
    expect(weekendSum).toBe(800); // 500 (Sat) + 300 (Sun)
  });

  it("calculates daily averages", () => {
    const avg = getDailyAverage(sampleExpenses);
    expect(avg).toBe(333.33); // 1000 total / 3 days span
  });

  it("compares month over month changes", () => {
    const current = [{ id: "1", amount: 1500, category: "Wants", subcategory: "Shopping", note: "", date: "2026-07-01" }];
    const previous = [{ id: "2", amount: 1000, category: "Wants", subcategory: "Shopping", note: "", date: "2026-06-01" }];
    const mom = getMonthOverMonth(current, previous);
    expect(mom.change).toBe(500);
    expect(mom.percentChange).toBe(50);
    expect(mom.direction).toBe("increased");
  });

  it("checks budget utilization status", () => {
    const utilization = getBudgetUtilization(sampleExpenses, 1200);
    expect(utilization.spent).toBe(1000);
    expect(utilization.remaining).toBe(200);
    expect(utilization.percentage).toBe(83.3);
    expect(utilization.status).toBe("caution");
  });
});

describe("API Gateway Isolation Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds correct API calls dynamically", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ expenses: [] }),
    });
    global.fetch = fetchMock;

    await apiGateway.fetchExpenses("2026-07");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/expenses?month=2026-07"), expect.any(Object));
  });
});
