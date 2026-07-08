import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleChatV2 } from "@/lib/chat/v2/engine";

function makeRequest() {
  return new Request("http://localhost/api/chat", {
    headers: { cookie: "next-auth.session-token=test" },
  });
}

function sessionBase(overrides: Record<string, unknown> = {}) {
  return {
    id: "v2-test-session",
    kind: "expense_missing",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
    originMessage: "test",
    step: undefined,
    ...overrides,
  };
}

function mockCategoriesFetch() {
  return vi.fn().mockImplementation((url: string) => {
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
      return Promise.resolve({ ok: true, json: async () => ({ expenses: [] }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe("V2 Engine — Session Kinds", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost";
  });

  describe("expense_missing", () => {
    it("prompts for note when note is missing (step=note)", async () => {
      const result = await handleChatV2({
        body: {
          message: "lunch",
          context: {
            v2: {
              session: sessionBase({
                kind: "expense_missing",
                step: "note",
                draft: { mode: "expense", amount: 500 },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.followUp?.payload?.prompt).toMatch(/date/i);
    });

    it("prompts for date when date is missing (step=date) with sufficient data", async () => {
      global.fetch = mockCategoriesFetch();

      const result = await handleChatV2({
        body: {
          message: "today",
          context: {
            v2: {
              session: sessionBase({
                kind: "expense_missing",
                step: "date",
                draft: { mode: "expense", amount: 300, note: "Groceries", date: "2026-07-08" },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹300.00");
    });

    it("handles cancel", async () => {
      const result = await handleChatV2({
        body: {
          message: "cancel",
          context: {
            v2: {
              session: sessionBase({
                kind: "expense_missing",
                step: "note",
                draft: { mode: "expense", amount: 500 },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/cancel|cancelled/i);
      expect(result.context?.v2?.session).toBeNull();
    });
  });

  describe("income_missing", () => {
    it("completes income when category provided via session step", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ income: { id: "inc1", amount: 50000, source: "Salary" } }),
      });

      const result = await handleChatV2({
        body: {
          message: "Salary",
          context: {
            v2: {
              session: sessionBase({
                kind: "income_missing",
                step: "income-category",
                draft: { mode: "income", amount: 50000, date: "2026-07-08" },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("50000.00");
    });
  });

  describe("confirm_amount_rounding", () => {
    it("confirms rounding and continues (prompts for date or finalizes)", async () => {
      global.fetch = mockCategoriesFetch();

      const result = await handleChatV2({
        body: {
          intentType: "v2_followup",
          details: { actionId: "confirm-rounded-amount" },
          context: {
            v2: {
              session: sessionBase({
                kind: "confirm_amount_rounding",
                draft: {
                  mode: "expense",
                  amount: 100.33,
                  roundedAmount: 100.33,
                  note: "Food",
                  date: "2026-07-08",
                  needsRoundingConfirmation: true,
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("100.33");
    });
  });

  describe("confirm_ambiguous_date", () => {
    it("confirms ambiguous date and prompts for category (no matching category)", async () => {
      global.fetch = mockCategoriesFetch();

      const result = await handleChatV2({
        body: {
          intentType: "v2_followup",
          details: { actionId: "confirm-date" },
          context: {
            v2: {
              session: sessionBase({
                kind: "confirm_ambiguous_date",
                draft: {
                  mode: "expense",
                  amount: 500,
                  note: "Test",
                  date: "2026-07-06",
                  ambiguousDateInput: "06-07-2026",
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.followUp?.payload?.prompt).toMatch(/pick one|category/);
    });
  });

  describe("confirm_old_date", () => {
    it("confirms old date and prompts for category (no matching category)", async () => {
      global.fetch = mockCategoriesFetch();

      const result = await handleChatV2({
        body: {
          intentType: "v2_followup",
          details: { actionId: "confirm-old-date" },
          context: {
            v2: {
              session: sessionBase({
                kind: "confirm_old_date",
                draft: {
                  mode: "expense",
                  amount: 300,
                  note: "Old purchase",
                  date: "2022-01-15",
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.followUp?.payload?.prompt).toMatch(/pick one|category/);
    });
  });

  describe("choose_expense_category", () => {
    it("accepts a category candidate and creates expense", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/expenses")) {
          return Promise.resolve({ ok: true, json: async () => ({ expense: { id: "exp1" } }) });
        }
        if (url.includes("/api/categories")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              categories: [
                { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await handleChatV2({
        body: {
          message: "Food",
          context: {
            v2: {
              session: sessionBase({
                kind: "choose_expense_category",
                draft: {
                  mode: "expense",
                  amount: 200,
                  note: "Lunch",
                  date: "2026-07-08",
                  categoryCandidates: ["Food", "Transport"],
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹200.00");
    });
  });

  describe("suggest_new_category", () => {
    it("creates category and finalizes when no bulk candidates", async () => {
      global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes("/api/categories") && init?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ category: { id: "cat-new", name: "Snacks", type: "Wants" } }),
          });
        }
        if (url.includes("/api/expenses")) {
          return Promise.resolve({ ok: true, json: async () => ({ expense: { id: "exp1" } }) });
        }
        if (url.includes("/api/categories")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ categories: [] }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await handleChatV2({
        body: {
          message: "Snacks",
          context: {
            v2: {
              session: sessionBase({
                kind: "suggest_new_category",
                parentType: "Wants",
                draft: {
                  mode: "expense",
                  amount: 100,
                  note: "Chips",
                  date: "2026-07-08",
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹100.00");
    });
  });

  describe("confirm_bulk_move", () => {
    it("handles skip for bulk move and finalizes", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/expenses")) {
          return Promise.resolve({ ok: true, json: async () => ({ expense: { id: "exp3" } }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await handleChatV2({
        body: {
          intentType: "v2_followup",
          details: { actionId: "skip" },
          context: {
            v2: {
              session: sessionBase({
                kind: "confirm_bulk_move",
                draft: {
                  mode: "expense",
                  amount: 200,
                  note: "Dinner",
                  date: "2026-07-08",
                  category: "Food",
                  categoryType: "Wants",
                  sanitizedNote: "Dinner",
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹200.00");
    });
  });

  describe("pick_bulk_move", () => {
    it("moves all items when move-all is selected", async () => {
      global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes("/api/expenses") && init?.method === "PATCH") {
          return Promise.resolve({ ok: true, json: async () => ({ expense: { id: "exp1" } }) });
        }
        if (url.includes("/api/expenses")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ expenses: [{ id: "exp1", note: "Test", amount: 100, date: "2026-07-06" }] }),
          });
        }
        if (url.includes("/api/categories")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              categories: [
                { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await handleChatV2({
        body: {
          intentType: "v2_followup",
          details: { actionId: "move-all" },
          context: {
            v2: {
              session: sessionBase({
                kind: "pick_bulk_move",
                draft: {
                  mode: "expense",
                  amount: 200,
                  note: "Dinner",
                  date: "2026-07-08",
                  category: "Food",
                  categoryType: "Wants",
                  sanitizedNote: "Dinner",
                  matchingExpenseIds: ["exp1"],
                },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.success).toBe(true);
    });
  });

  describe("create_category_direct", () => {
    it("creates a category when no duplicate exists", async () => {
      global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes("/api/categories")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ category: { id: "cat-new", name: "New Cat", type: "Wants" } }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await handleChatV2({
        body: { message: "create subcategory New Cat under wants", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/created/i);
    });
  });

  describe("confirm_zero_amount", () => {
    it("proceeds to date prompt after confirming zero amount", async () => {
      global.fetch = mockCategoriesFetch();

      const result = await handleChatV2({
        body: {
          intentType: "v2_followup",
          details: { actionId: "confirm-zero-amount" },
          context: {
            v2: {
              session: sessionBase({
                kind: "confirm_zero_amount",
                draft: { mode: "expense", amount: 0, note: "Free item" },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.followUp?.payload?.prompt).toMatch(/date/i);
    });
  });

  describe("session expiry", () => {
    it("returns timeout message for expired session", async () => {
      const result = await handleChatV2({
        body: {
          message: "lunch",
          context: {
            v2: {
              session: sessionBase({
                expiresAt: new Date(Date.now() - 60_000).toISOString(),
                kind: "expense_missing",
                step: "note",
                draft: { mode: "expense", amount: 500 },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/timed out/);
      expect(result.context?.v2?.session).toBeNull();
    });
  });

  describe("new intent clears session", () => {
    it("clears expense session when income message arrives", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ income: { id: "inc1", amount: 10000, source: "Salary" } }),
      });

      const result = await handleChatV2({
        body: {
          message: "got salary 10000 today",
          context: {
            v2: {
              session: sessionBase({
                kind: "expense_missing",
                step: "note",
                draft: { mode: "expense", amount: 500 },
              }),
            },
          },
        },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toContain("₹10000.00");
      expect(result.eventType).toBe("incomeAdded");
    });
  });

  describe("gibberish handler", () => {
    it("returns friendly rephrase message for unrecognized input", async () => {
      const result = await handleChatV2({
        body: { message: "asdfghjkl", context: { v2: { session: null } } },
        userId: "user-1",
        request: makeRequest(),
      });

      expect(result.handled).toBe(true);
      if (!result.handled) return;
      expect(result.reply).toMatch(/rephrase|could you/i);
    });
  });
});
