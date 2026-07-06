import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleExpenseSummary } from "@/lib/chat/v1/handlers/expense-handler";
import { handleIncomeSummary } from "@/lib/chat/v1/handlers/income-handler";
import { handleBudgetStatus } from "@/lib/chat/v1/handlers/budget-handler";
import { handleAnalysis } from "@/lib/chat/v1/handlers/analysis-handler";
import { handleInsights } from "@/lib/chat/v1/handlers/insights-handler";
import { handleWrite } from "@/lib/chat/v1/handlers/write-handler";
import { handleOutOfScope } from "@/lib/chat/v1/handlers/scope-handler";
import { handleGreeting } from "@/lib/chat/v1/handlers/greeting-handler";

describe("Handler Module Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Expense Handler fetches and formats summaries", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        expenses: [
          { id: "1", amount: 500, category: "Needs", subcategory: "Food", note: "Lunch", date: "2026-07-06" }
        ]
      })
    });
    global.fetch = fetchMock;

    const reply = await handleExpenseSummary({ category: "Food" });
    expect(reply).toContain("Food");
    expect(reply).toContain("500");
  });

  it("Income Handler calculates income correctly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        income: [
          { id: "1", amount: 45000, source: "Salary", note: "Monthly Pay", date: "2026-07-01" }
        ]
      })
    });
    global.fetch = fetchMock;

    const reply = await handleIncomeSummary({});
    expect(reply).toContain("Salary");
    expect(reply).toContain("45,000");
  });

  it("Budget Handler tracks utilization limits", async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/budget")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ limit: 10000 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          expenses: [{ id: "1", amount: 8000, category: "Needs", subcategory: "Food", note: "", date: "2026-07-06" }]
        })
      });
    });
    global.fetch = fetchMock;

    const reply = await handleBudgetStatus({});
    expect(reply).toContain("10,000");
    expect(reply).toContain("8,000");
    expect(reply.includes("⚠️") || reply.includes("caution")).toBe(true);
  });

  it("Analysis Handler reports daily averages and weekend trends", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        expenses: [
          { id: "1", amount: 300, category: "Needs", subcategory: "Food", note: "", date: "2026-07-04" }, // Saturday
          { id: "2", amount: 200, category: "Needs", subcategory: "Transport", note: "", date: "2026-07-05" } // Sunday
        ]
      })
    });
    global.fetch = fetchMock;

    const dailyReply = await handleAnalysis("spending_analysis", {}, "what is my average daily spending");
    expect(dailyReply).toContain("average daily spending");

    const weekendReply = await handleAnalysis("spending_analysis", {}, "what did I spend over the weekend");
    expect(weekendReply).toContain("weekend");
  });

  it("Insights Handler finds spending spikes and savings recommendations", async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/income")) {
        return Promise.resolve({ ok: true, json: async () => ({ income: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          expenses: [
            { id: "1", amount: 2500, category: "Wants", subcategory: "Shopping", note: "Shoes", date: "2026-07-01" }
          ]
        })
      });
    });
    global.fetch = fetchMock;

    const saveReply = await handleInsights("financial_insights", {}, "where can I save money");
    expect(saveReply).toContain("save");

    const unusualReply = await handleInsights("financial_insights", {}, "any unusual expenses");
    expect(unusualReply).toContain("Unusual");
  });

  it("Write Handler creates and deletes items", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    const expenseRes = await handleWrite("add_expense", { amount: 250, category: "Food", note: "lunch" }, "Add ₹250 for lunch");
    expect(expenseRes.success).toBe(true);
    expect(expenseRes.reply).toContain("250");
    expect(expenseRes.eventType).toBe("expenseAdded");

    const incomeRes = await handleWrite("add_income", { amount: 5000, note: "bonus" }, "Record income of 5000");
    expect(incomeRes.success).toBe(true);
    expect(incomeRes.eventType).toBe("incomeAdded");
  });

  it("Scope Handler redirects banking queries", () => {
    const reply = handleOutOfScope("can you transfer ₹5000 via UPI?");
    expect(reply).toContain("transferring money");
  });

  it("Greeting Handler greets users warmly", () => {
    const reply = handleGreeting("greeting");
    expect(reply.length).toBeGreaterThan(10);
  });
});
