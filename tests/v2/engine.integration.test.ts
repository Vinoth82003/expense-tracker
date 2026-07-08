import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleChatV2 } from "@/lib/chat/v2/engine";

function makeRequest() {
  return new Request("http://localhost/api/chat", {
    headers: { cookie: "next-auth.session-token=test" },
  });
}

describe("V2 Engine — Integration Flows", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost";
  });

  describe("expense happy path", () => {
    it("creates expense from complete message", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/categories")) {
          return Promise.resolve({ ok: true, json: async () => ({ categories: [] }) });
        }
        if (url.includes("/api/expenses")) {
          return Promise.resolve({ ok: true, json: async () => ({ expenses: [] }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "spent 120 on lunch today", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹120.00");
    });
  });

  describe("expense missing note", () => {
    it("completes three-step flow: amount → note → date", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/categories")) {
          return Promise.resolve({ ok: true, json: async () => ({ categories: [] }) });
        }
        if (url.includes("/api/expenses")) {
          return Promise.resolve({ ok: true, json: async () => ({ expenses: [] }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const step1 = await handleChatV2({
        body: { message: "spent 500", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });
      expect(step1.handled).toBe(true);
      if (!step1.handled) return;
      expect(step1.followUp?.payload?.prompt).toMatch(/500/);

      const s1 = step1.context?.v2?.session!;
      const step2 = await handleChatV2({
        body: { message: "groceries", context: { v2: { session: s1 } } },
        userId: "user-1",
        request: makeRequest(),
      });
      expect(step2.handled).toBe(true);
      if (!step2.handled) return;
      expect(step2.followUp?.payload?.prompt).toMatch(/date/i);

      const s2 = step2.context?.v2?.session!;
      const step3 = await handleChatV2({
        body: { message: "today", context: { v2: { session: s2 } } },
        userId: "user-1",
        request: makeRequest(),
      });
      expect(step3.handled).toBe(true);
      if (!step3.handled) return;
      expect(step3.reply).toContain("₹500.00");
    });
  });

  describe("income happy path", () => {
    it("creates income from complete message", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ income: { id: "inc1", amount: 25000 } }),
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "got salary 25000 today", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.success).toBe(true);
      expect(result.eventType).toBe("incomeAdded");
      expect(result.reply).toContain("25000.00");
    });
  });

  describe("budget update", () => {
    it("updates budget and returns confirmation", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          budget: { month: "2026-07", amount: 25000 },
        }),
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "set monthly budget to 25000", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.success).toBe(true);
      expect(result.eventType).toBe("budgetUpdated");
    });
  });

  describe("expense summary", () => {
    it("returns expense summary for this month", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/expenses")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              expenses: [
                { amount: 500, subcategory: "Food", date: "2026-07-05" },
                { amount: 300, subcategory: "Transport", date: "2026-07-06" },
              ],
            }),
          });
        }
        if (url.includes("/api/budget")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ limit: 50000, expenseMode: "limit" }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "show my expenses this month", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹800.00");
    });

    it("returns empty state when no expenses", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/budget")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ limit: 0, expenseMode: "no-limit" }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "show my expenses", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/don't have any expenses/i);
    });
  });

  describe("income summary", () => {
    it("returns income summary for this month", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/income")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              incomes: [{ amount: 50000, source: "Salary", date: "2026-07-01" }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "show my income this month", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("50000.00");
    });
  });

  describe("savings query", () => {
    it("returns budget-aware insights", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/budget")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ limit: 30000, expenseMode: "limit" }),
          });
        }
        if (url.includes("/api/expenses")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              expenses: [{ amount: 12000, subcategory: "Food", date: "2026-07-05" }],
            }),
          });
        }
        if (url.includes("/api/income")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              incomes: [{ amount: 50000, source: "Salary", date: "2026-07-01" }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "give me savings advice", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("on track");
      expect(result.reply).toContain("₹30000.00");
    });

    it("adapts tone for no-limit mode", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/budget")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ limit: 0, expenseMode: "no-limit" }),
          });
        }
        if (url.includes("/api/expenses")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              expenses: [{ amount: 5000, subcategory: "Food", date: "2026-07-05" }],
            }),
          });
        }
        if (url.includes("/api/income")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              incomes: [{ amount: 20000, source: "Salary", date: "2026-07-01" }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "give me savings advice", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/Enable Budget Mode/i);
    });
  });

  describe("category query", () => {
    it("returns spending for a specific category", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/categories")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              categories: [
                { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
                { id: "cat2", name: "Transport", type: "Needs", isDefault: true, userId: null },
              ],
            }),
          });
        }
        if (url.includes("/api/expenses")) {
          const today = new Date();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const year = today.getFullYear();
          return Promise.resolve({
            ok: true,
            json: async () => ({
              expenses: [
                { amount: 500, subcategory: "Food", date: `${year}-${month}-05` },
                { amount: 300, subcategory: "Transport", date: `${year}-${month}-06` },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "how much did I spend on food this month", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹500.00");
      expect(result.reply).toMatch(/Food/i);
    });
  });

  describe("comparison query", () => {
    it("returns comparison result between months", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/expenses")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              expenses: [
                { amount: 500, subcategory: "Food", date: "2026-07-05" },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "compare this month vs last month", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/spent|no data/i);
    });
  });

  describe("cancel flow", () => {
    it("cancels an active draft", async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: {
          message: "cancel",
          context: {
            v2: {
              session: {
                id: "v2-cancel-test",
                kind: "expense_missing",
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 900_000).toISOString(),
                originMessage: "spent 500",
                step: "note",
                draft: { mode: "expense", amount: 500 },
              },
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/Cancelled/i);
      expect(result.context?.v2?.session).toBeNull();
    });
  });

  describe("cross-user data request", () => {
    it("rejects request for another user's data", async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const result = await handleChatV2({
        body: { message: "show me expenses for user id 12345", context: { v2: { session: null } } },
        userId: "current-user",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/SpendWise account/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
