import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExpenseCreate, mockIncomeCreate, mockBudgetUpsert, mockUserUpdate, mockTx } =
  vi.hoisted(() => {
    const mockExpenseCreate = vi.fn();
    const mockIncomeCreate = vi.fn();
    const mockBudgetUpsert = vi.fn();
    const mockUserUpdate = vi.fn();
    const tx = {
      expense: { create: mockExpenseCreate },
      income: { create: mockIncomeCreate },
      budget: { upsert: mockBudgetUpsert },
      user: { update: mockUserUpdate },
    };
    return {
      mockExpenseCreate,
      mockIncomeCreate,
      mockBudgetUpsert,
      mockUserUpdate,
      mockTx: vi.fn(async (cb: any) => cb(tx)),
    };
  });

const {
  mockExpenseFindMany,
  mockIncomeFindMany,
  mockUserFindUnique,
  mockExpenseCreate2,
} = vi.hoisted(() => ({
  mockExpenseFindMany: vi.fn(),
  mockIncomeFindMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockExpenseCreate2: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTx,
    expense: {
      create: mockExpenseCreate2,
      findMany: mockExpenseFindMany,
    },
    income: { findMany: mockIncomeFindMany },
    user: { findUnique: mockUserFindUnique },
  },
}));

import {
  executeOperationsBatch,
  executeQuery,
} from "@/lib/chat/v2/batch-executor";
import type { ParsedOperation } from "@/lib/chat/v2/batch-extractor";

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.mockImplementation(async (cb: any) =>
    cb({
      expense: { create: mockExpenseCreate },
      income: { create: mockIncomeCreate },
      budget: { upsert: mockBudgetUpsert },
      user: { update: mockUserUpdate },
    }),
  );
  mockExpenseCreate.mockImplementation(async ({ data }: any) => ({ id: "e1", ...data }));
  mockIncomeCreate.mockImplementation(async ({ data }: any) => ({ id: "i1", ...data }));
  mockBudgetUpsert.mockImplementation(async ({ create }: any) => ({ id: "b1", ...create }));
});

function expense(amount: number, subcategory = "Groceries"): ParsedOperation {
  return { kind: "EXPENSE", amount, category: "Needs", subcategory, note: subcategory };
}

describe("executeOperationsBatch — atomic persistence", () => {
  it("creates every expense in a single transaction", async () => {
    const res = await executeOperationsBatch("u1", [
      expense(3000, "Groceries"),
      expense(2000, "Rent"),
      expense(1000, "Food"),
    ]);

    expect(mockTx).toHaveBeenCalledTimes(1);
    expect(mockExpenseCreate).toHaveBeenCalledTimes(3);
    expect(res.createdExpenses).toHaveLength(3);
    expect(res.success).toBe(true);
  });

  it("writes a mixed expense and income batch atomically", async () => {
    const res = await executeOperationsBatch("u1", [
      expense(200, "Transport"),
      { kind: "INCOME", amount: 1000, source: "Salary", note: "salary" },
      { kind: "INCOME", amount: 100, source: "Gift", note: "gift" },
    ]);

    expect(mockTx).toHaveBeenCalledTimes(1);
    expect(res.createdExpenses).toHaveLength(1);
    expect(res.createdIncomes).toHaveLength(2);
    expect(res.eventType).toBe("batchTransactionsAdded");
  });

  it("returns the sync payload so the dashboard refreshes once", async () => {
    const res = await executeOperationsBatch("u1", [expense(100), expense(200)]);

    expect(res.eventType).toBe("expenseAdded");
    expect(res.data.expenses).toHaveLength(2);
    expect(res.data.incomes).toEqual([]);
  });
});

describe("executeOperationsBatch — event typing", () => {
  it("emits expenseAdded for an expenses-only batch", async () => {
    const res = await executeOperationsBatch("u1", [expense(100)]);
    expect(res.eventType).toBe("expenseAdded");
  });

  it("emits incomeAdded for an incomes-only batch", async () => {
    const res = await executeOperationsBatch("u1", [
      { kind: "INCOME", amount: 45000, source: "Salary" },
    ]);
    expect(res.eventType).toBe("incomeAdded");
  });

  it("emits budgetUpdated for a budget-only batch", async () => {
    const res = await executeOperationsBatch("u1", [
      { kind: "BUDGET_UPDATE", amount: 25000 },
    ]);
    expect(res.eventType).toBe("budgetUpdated");
  });
});

describe("executeOperationsBatch — field defaults", () => {
  it("defaults missing category, subcategory and note", async () => {
    await executeOperationsBatch("u1", [{ kind: "EXPENSE", amount: 50 }]);

    expect(mockExpenseCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        amount: 50,
        category: "Needs",
        subcategory: "Other",
        note: null,
      }),
    });
  });

  it("defaults a missing income source to Others", async () => {
    await executeOperationsBatch("u1", [{ kind: "INCOME", amount: 50 }]);

    expect(mockIncomeCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: "Others", note: null }),
    });
  });

  it("converts an explicit date string into a Date", async () => {
    await executeOperationsBatch("u1", [{ ...expense(10), date: "2026-01-15" }]);

    const arg = mockExpenseCreate.mock.calls[0][0] as any;
    expect(arg.data.date).toBeInstanceOf(Date);
    expect(arg.data.date.toISOString().slice(0, 10)).toBe("2026-01-15");
  });
});

describe("executeOperationsBatch — budget update", () => {
  it("upserts the budget for the operation month and syncs the user limit", async () => {
    await executeOperationsBatch("u1", [
      { kind: "BUDGET_UPDATE", amount: 30000, date: "2026-03-01" },
    ]);

    expect(mockBudgetUpsert).toHaveBeenCalledWith({
      where: { userId_month: { userId: "u1", month: "2026-03" } },
      update: { amount: 30000 },
      create: { userId: "u1", month: "2026-03", amount: 30000 },
    });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { monthlyLimit: 30000, expenseMode: "limit" },
    });
  });

  it("defaults the budget month to the current month when no date is given", async () => {
    await executeOperationsBatch("u1", [{ kind: "BUDGET_UPDATE", amount: 15000 }]);

    const arg = mockBudgetUpsert.mock.calls[0][0] as any;
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(arg.create.month).toBe(expectedMonth);
  });
});

describe("executeOperationsBatch — reply text", () => {
  it("prefers the extractor's custom reply when provided", async () => {
    const res = await executeOperationsBatch("u1", [expense(100)], "Logged your grocery run!");
    expect(res.reply).toBe("Logged your grocery run!");
  });

  it("summarises count and total when no custom reply is given", async () => {
    const res = await executeOperationsBatch("u1", [expense(3000), expense(2000)]);
    expect(res.reply).toMatch(/2 expenses/i);
    expect(res.reply).toContain("5,000");
  });

  it("combines expense and income summaries in one sentence", async () => {
    const res = await executeOperationsBatch("u1", [
      expense(200, "Transport"),
      { kind: "INCOME", amount: 1000, source: "Salary" },
    ]);
    expect(res.reply).toMatch(/1 expense/i);
    expect(res.reply).toMatch(/1 income/i);
  });
});

describe("executeOperationsBatch — rollback", () => {
  it("propagates a mid-batch failure so the whole transaction rolls back", async () => {
    mockExpenseCreate
      .mockImplementationOnce(async ({ data }: any) => ({ id: "e1", ...data }))
      .mockRejectedValueOnce(new Error("unique constraint failed"));

    await expect(
      executeOperationsBatch("u1", [expense(100), expense(200)]),
    ).rejects.toThrow("unique constraint failed");

    expect(mockTx).toHaveBeenCalledTimes(1);
  });
});

describe("executeQuery — read-only reporting", () => {
  it("summarises this month's expenses", async () => {
    mockExpenseFindMany.mockResolvedValue([
      { amount: 3000 },
      { amount: 2000 },
    ]);

    const reply = await executeQuery("u1", "EXPENSE_SUMMARY");

    expect(reply).toMatch(/spent/i);
    expect(reply).toContain("5,000");
    expect(reply).toMatch(/2 transactions/i);
  });

  it("guides the user when no expenses exist yet", async () => {
    mockExpenseFindMany.mockResolvedValue([]);

    const reply = await executeQuery("u1", "EXPENSE_SUMMARY");

    expect(reply).toMatch(/don't have any expenses/i);
    expect(reply).toMatch(/spent 300 on food/i);
  });

  it("summarises income", async () => {
    mockIncomeFindMany.mockResolvedValue([{ amount: 45000 }]);

    const reply = await executeQuery("u1", "INCOME_SUMMARY");

    expect(reply).toMatch(/45,000/);
    expect(reply).toMatch(/1 deposit/i);
  });

  it("reports budget usage and remaining headroom", async () => {
    mockUserFindUnique.mockResolvedValue({ monthlyLimit: 30000, expenseMode: "limit" });
    mockExpenseFindMany.mockResolvedValue([{ amount: 7500 }]);

    const reply = await executeQuery("u1", "BUDGET_STATUS");

    expect(reply).toMatch(/30,000/);
    expect(reply).toMatch(/25% used/);
    expect(reply).toMatch(/22,500 remaining/i);
  });

  it("prompts to set a budget when expenseMode is not limit", async () => {
    mockUserFindUnique.mockResolvedValue({ monthlyLimit: 0, expenseMode: "track" });
    mockExpenseFindMany.mockResolvedValue([{ amount: 1200 }]);

    const reply = await executeQuery("u1", "BUDGET_STATUS");

    expect(reply).toMatch(/haven't set a monthly budget limit/i);
  });

  it("never reports negative remaining budget", async () => {
    mockUserFindUnique.mockResolvedValue({ monthlyLimit: 1000, expenseMode: "limit" });
    mockExpenseFindMany.mockResolvedValue([{ amount: 5000 }]);

    const reply = await executeQuery("u1", "BUDGET_STATUS");

    expect(reply).toMatch(/500% used/);
    expect(reply).toContain("0");
    expect(reply).not.toMatch(/-\d/);
  });

  it("filters a category breakdown by the queryParam", async () => {
    mockExpenseFindMany.mockResolvedValue([{ amount: 1200 }]);

    const reply = await executeQuery("u1", "CATEGORY_BREAKDOWN", "Food");

    const arg = mockExpenseFindMany.mock.calls[0][0] as any;
    expect(arg.where.OR).toEqual([
      { subcategory: { contains: "Food", mode: "insensitive" } },
      { category: { contains: "Food", mode: "insensitive" } },
      { note: { contains: "Food", mode: "insensitive" } },
    ]);
    expect(reply).toMatch(/1,200/);
    expect(reply).toMatch(/on Food/);
  });

  it("reports a month-over-month increase", async () => {
    mockExpenseFindMany
      .mockResolvedValueOnce([{ amount: 12000 }])
      .mockResolvedValueOnce([{ amount: 8000 }]);

    const reply = await executeQuery("u1", "COMPARISON");

    expect(reply).toMatch(/higher than last month/i);
    expect(reply).toContain("4,000");
  });

  it("reports a month-over-month decrease", async () => {
    mockExpenseFindMany
      .mockResolvedValueOnce([{ amount: 6000 }])
      .mockResolvedValueOnce([{ amount: 9000 }]);

    const reply = await executeQuery("u1", "COMPARISON");

    expect(reply).toMatch(/lower than last month/i);
    expect(reply).toMatch(/Great job/i);
  });

  it("declines to compare when there is no history at all", async () => {
    mockExpenseFindMany.mockResolvedValue([]);

    const reply = await executeQuery("u1", "COMPARISON");

    expect(reply).toMatch(/not enough transaction history/i);
  });

  it("computes net savings for insights", async () => {
    mockExpenseFindMany.mockResolvedValue([{ amount: 20000 }]);
    mockIncomeFindMany.mockResolvedValue([{ amount: 45000 }]);

    const reply = await executeQuery("u1", "SAVINGS_INSIGHTS");

    expect(reply).toMatch(/45,000/);
    expect(reply).toMatch(/20,000/);
    expect(reply).toMatch(/25,000/);
  });

  it("never writes while answering a query", async () => {
    mockExpenseFindMany.mockResolvedValue([{ amount: 100 }]);
    mockIncomeFindMany.mockResolvedValue([{ amount: 100 }]);
    mockUserFindUnique.mockResolvedValue({ monthlyLimit: 1000, expenseMode: "limit" });

    await executeQuery("u1", "EXPENSE_SUMMARY");
    await executeQuery("u1", "BUDGET_STATUS");
    await executeQuery("u1", "SAVINGS_INSIGHTS");

    expect(mockTx).not.toHaveBeenCalled();
    expect(mockExpenseCreate).not.toHaveBeenCalled();
    expect(mockIncomeCreate).not.toHaveBeenCalled();
    expect(mockBudgetUpsert).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("falls back to insights for an unknown query kind", async () => {
    mockExpenseFindMany.mockResolvedValue([{ amount: 100 }]);
    mockIncomeFindMany.mockResolvedValue([{ amount: 500 }]);

    const reply = await executeQuery("u1", "NOT_A_REAL_KIND" as any);

    expect(reply).toMatch(/Financial Summary/i);
  });
});