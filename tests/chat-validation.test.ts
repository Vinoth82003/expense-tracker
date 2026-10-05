import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftOperation } from "@/lib/chat/v2/validation";

/**
 * The validation layer is the only thing standing between a half-understood
 * message and the ledger. These tests pin the two properties that matter:
 *
 *   1. Nothing is written until every required field is known.
 *   2. Skipping or cancelling writes nothing at all — never a partial batch.
 */

const {
  mockUserFindUnique,
  mockCategoryFindMany,
  mockCategoryCreate,
  mockExpenseCreate,
  mockExpenseFindMany,
  mockIncomeCreate,
  mockIncomeFindMany,
  mockBudgetUpsert,
  mockUserUpdate,
  mockExecuteOperationsBatch,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockCategoryFindMany: vi.fn(),
  mockCategoryCreate: vi.fn(),
  mockExpenseCreate: vi.fn(),
  mockExpenseFindMany: vi.fn(),
  mockIncomeCreate: vi.fn(),
  mockIncomeFindMany: vi.fn(),
  mockBudgetUpsert: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockExecuteOperationsBatch: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique, update: mockUserUpdate },
    category: { findMany: mockCategoryFindMany, create: mockCategoryCreate },
    expense: { create: mockExpenseCreate, findMany: mockExpenseFindMany },
    income: { create: mockIncomeCreate, findMany: mockIncomeFindMany },
    budget: { upsert: mockBudgetUpsert },
  },
}));

vi.mock("@/lib/chat/v2/batch-executor", () => ({
  executeOperationsBatch: mockExecuteOperationsBatch,
}));

const {
  collectMissing,
  handleValidationFollowUp,
  readValidationSession,
  startValidation,
} = await import("@/lib/chat/v2/validation");

const USER = "user-1";
const OTHER_USER = "user-2";

/** A draft expense with nothing filled in, overridden per test. */
function expense(over: Partial<DraftOperation> = {}): DraftOperation {
  return {
    kind: "EXPENSE",
    amount: 100,
    category: null,
    subcategory: null,
    source: null,
    note: "",
    date: null,
    ...over,
  };
}

/** A draft income with nothing filled in, overridden per test. */
function income(over: Partial<DraftOperation> = {}): DraftOperation {
  return { ...expense(), kind: "INCOME", ...over };
}

/** A fully specified expense — nothing left to ask about. */
function completeExpense(over: Partial<DraftOperation> = {}): DraftOperation {
  return expense({ amount: 300, date: "2026-03-01", category: "Needs", subcategory: "Snacks", ...over });
}

/** Answers a prompt by feeding its own session back, as the client does. */
async function answer(outcome: any, actionId: string, value?: string, userId = USER) {
  const session = outcome.context?.validation?.session;
  return handleValidationFollowUp(userId, session, actionId, value);
}

/** The prompt block the client renders buttons and inputs from. */
function payloadOf(outcome: any) {
  return outcome.followUp!.payload;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindUnique.mockResolvedValue({ expenseMode: "limit", monthlyLimit: 25000 });
  mockCategoryFindMany.mockResolvedValue([
    { name: "Food" },
    { name: "Transport" },
    { name: "Groceries" },
  ]);
  mockExpenseFindMany.mockResolvedValue([]);
  mockIncomeFindMany.mockResolvedValue([]);
  mockCategoryCreate.mockImplementation(async ({ data }: any) => ({ id: "c1", ...data }));
  mockExpenseCreate.mockImplementation(async ({ data }: any) => ({ id: "e1", ...data }));
  mockIncomeCreate.mockImplementation(async ({ data }: any) => ({ id: "i1", ...data }));
  mockBudgetUpsert.mockResolvedValue({ userId: USER, month: "2026-03", amount: 30000 });
  mockUserUpdate.mockResolvedValue({});
  mockExecuteOperationsBatch.mockResolvedValue({
    success: true,
    reply: "Logged 1 expense.",
    createdExpenses: [{ id: "e1" }],
    createdIncomes: [],
    updatedBudget: null,
    eventType: "batchTransactionsAdded",
    data: { expenses: [{ id: "e1" }], incomes: [], budget: null },
  });
});

// ── collectMissing ────────────────────────────────────────────────────────

describe("collectMissing", () => {
  it("reports nothing missing for a fully specified expense", () => {
    expect(collectMissing([completeExpense()])).toEqual([]);
  });

  it("reports a date when one was never given", () => {
    expect(collectMissing([completeExpense({ date: null })])).toContain("date");
  });

  it("reports a category when the parent is missing", () => {
    expect(collectMissing([completeExpense({ category: null })])).toContain("category");
  });

  it("reports a category when the subcategory is missing", () => {
    // A subcategory with no parent cannot be filed, so it still counts.
    expect(collectMissing([completeExpense({ subcategory: null })])).toContain("category");
  });

  it("reports a source for income", () => {
    expect(collectMissing([income({ amount: 900, date: "2026-03-01" })])).toContain("source");
  });

  it("asks for a date once for the whole batch, not once per row", () => {
    const missing = collectMissing([expense(), expense({ amount: 200 }), expense({ amount: 300 })]);
    expect(missing.filter((f) => f === "date")).toHaveLength(1);
  });

  it("never demands a date from a budget-only request", () => {
    const budget: DraftOperation = { ...expense(), kind: "BUDGET_UPDATE", amount: 30000 };
    expect(collectMissing([budget])).toEqual([]);
  });

  it("orders prompts date -> category -> source", () => {
    const missing = collectMissing([income(), expense()]);
    expect(missing).toEqual(["date", "category", "source"]);
  });
});

// ── startValidation ───────────────────────────────────────────────────────

describe("startValidation", () => {
  it("writes immediately when the user supplied every field", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );

    expect(outcome.status).toBe("executed");
    expect(outcome.success).toBe(true);
    expect(mockExecuteOperationsBatch).toHaveBeenCalledTimes(1);
  });

  it("prompts instead of writing when the date is missing", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    expect(outcome.status).toBe("prompt");
    expect(outcome.success).toBe(false);
    expect(outcome.followUp?.type).toBe("validation_followup");
    // The single most important assertion in this file.
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("recovers the date the user typed instead of asking again", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch).toHaveBeenCalledTimes(1);
  });

  it("sends one prompt covering every missing field across the batch", async () => {
    const outcome = await startValidation(
      USER,
      [
        { kind: "EXPENSE", amount: 300, subcategory: "Snacks" },
        { kind: "EXPENSE", amount: 200, subcategory: "Fuel" },
      ],
      "spent 300 on snacks and 200 on fuel",
    );

    expect(outcome.status).toBe("prompt");
    expect(outcome.context!.validation.session.missing).toEqual(["date", "category"]);
  });

  it("never defaults a missing date to today", async () => {
    // The regression this whole module exists for.
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    expect(outcome.context!.validation.session.operations[0].date).toBeNull();
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("offers the user's own categories in the category prompt", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );

    expect(outcome.status).toBe("prompt");
    expect(outcome.reply).toMatch(/categor/i);
  });

  it("offers a skip option on every prompt", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    const skip = payloadOf(outcome).options.find((o: any) => o.id === "skip");
    expect(skip).toBeTruthy();
    expect(skip.action).toBe("cancel");
  });

  it("allows a date to be picked from a calendar up to today", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    expect(payloadOf(outcome).allowDateInput).toBe(true);
    expect(payloadOf(outcome).maxDate).toBeTruthy();
  });
});

// ── handleValidationFollowUp — dates ──────────────────────────────────────

describe("handleValidationFollowUp — dates", () => {
  function datePrompt() {
    return startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );
  }

  it("writes once the date is supplied", async () => {
    const outcome = await answer(await datePrompt(), "pick-date", "2026-03-01");

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch).toHaveBeenCalledTimes(1);
  });

  it("applies one date to every row that was missing one", async () => {
    const prompt = await startValidation(
      USER,
      [
        { kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" },
        { kind: "EXPENSE", amount: 200, category: "Needs", subcategory: "Fuel" },
      ],
      "spent 300 on snacks and 200 on fuel",
    );

    const outcome = await answer(prompt, "pick-date", "2026-03-01");

    const written = mockExecuteOperationsBatch.mock.calls[0][1];
    expect(written.every((op: any) => op.date === "2026-03-01")).toBe(true);
    expect(outcome.status).toBe("executed");
  });

  it("re-asks instead of guessing when a malformed date arrives", async () => {
    const outcome = await answer(await datePrompt(), "pick-date", "15/03/2026");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("re-asks instead of defaulting to today when no date arrives at all", async () => {
    const outcome = await answer(await datePrompt(), "pick-date", undefined);

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("refuses a future date", async () => {
    const outcome = await answer(await datePrompt(), "pick-date", "2099-01-01");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });
});

// ── handleValidationFollowUp — categories ─────────────────────────────────

describe("handleValidationFollowUp — categories", () => {
  function categoryPrompt() {
    return startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );
  }

  it("writes once a category is chosen", async () => {
    const outcome = await answer(await categoryPrompt(), "pick-category", "Food");

    expect(outcome.status).toBe("executed");
    const written = mockExecuteOperationsBatch.mock.calls[0][1];
    expect(written[0].category).toBeTruthy();
    expect(written[0].subcategory).toBe("Food");
  });

  it("accepts the exact id the prompt itself emitted", async () => {
    // Regression guard, and the reason the rest of this block used to pass
    // while the app looped: choice ids are parameterised ("pick-category:Food").
    // Matching them against the bare string "pick-category" rejected every
    // button the UI could actually render, so Sage re-offered the same question
    // forever. Answered here with the real option off the real payload, which is
    // what the browser sends.
    const prompt = await categoryPrompt();
    const option = payloadOf(prompt).options.find((o: any) => o.id.startsWith("pick-category:"));

    expect(option, "prompt should offer a parameterised category option").toBeTruthy();

    const outcome = await answer(prompt, option.id, option.value);

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch).toHaveBeenCalledTimes(1);
    expect(mockExecuteOperationsBatch.mock.calls[0][1][0].subcategory).toBe(option.value);
  });

  it("still refuses a category action the prompt never offered", async () => {
    // The widened prefix match must not become a free-for-all.
    const outcome = await answer(await categoryPrompt(), "pick-date", "2026-03-01");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("still refuses a category-prefixed id carrying an empty value", async () => {
    const outcome = await answer(await categoryPrompt(), "pick-category:Food", "   ");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("refuses a free-text answer that did not come from this step's field", async () => {
    const first = await answer(await categoryPrompt(), "pick-custom-category", undefined);
    expect(first.status).toBe("prompt");

    const outcome = await answer(first, "pick-category:Food", "Sneaky");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("does not loop forever when only the parent category was missing", async () => {
    // Regression guard: if applyCategory only looked at subcategory, this
    // operation stayed unresolved and Sage re-asked the same question forever.
    const prompt = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", category: "Needs" }],
      "spent 300 on food on 2026-03-01",
    );
    expect(prompt.status).toBe("prompt");

    const outcome = await answer(prompt, "pick-category", "Snacks");

    expect(outcome.status).toBe("executed");
  });

  it("asks for the name when the user chooses a custom category", async () => {
    const outcome = await answer(await categoryPrompt(), "pick-custom-category", undefined);

    expect(outcome.status).toBe("prompt");
    expect(payloadOf(outcome).allowTextInput).toBe(true);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("accepts a typed custom subcategory and writes", async () => {
    const first = await answer(await categoryPrompt(), "pick-custom-category", undefined);
    const outcome = await answer(first, "custom-subcategory", "Coffee");

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch.mock.calls[0][1][0].subcategory).toBe("Coffee");
  });

  it("re-asks rather than writing an empty category", async () => {
    const outcome = await answer(await categoryPrompt(), "pick-category", "   ");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });
});

// ── handleValidationFollowUp — income sources ────────────────────────────

describe("handleValidationFollowUp — income sources", () => {
  function sourcePrompt() {
    return startValidation(
      USER,
      [{ kind: "INCOME", amount: 900, date: "2026-03-01" }],
      "received 900 on 2026-03-01",
    );
  }

  it("writes once a valid source is chosen", async () => {
    const outcome = await answer(await sourcePrompt(), "pick-source", "Salary");

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch.mock.calls[0][1][0].source).toBe("Salary");
  });

  it("accepts the exact id the prompt itself emitted", async () => {
    // Same parameterised-id contract as categories: "pick-source:Salary".
    const prompt = await sourcePrompt();
    const option = payloadOf(prompt).options.find((o: any) => o.id.startsWith("pick-source:"));

    expect(option, "prompt should offer a parameterised source option").toBeTruthy();

    const outcome = await answer(prompt, option.id, option.value);

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch.mock.calls[0][1][0].source).toBe(option.value);
  });

  it("rejects a source outside the known set", async () => {
    const outcome = await answer(await sourcePrompt(), "pick-source", "Lottery");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("rejects an unlisted source sent under a matching id prefix", async () => {
    // The prefix matches, the value does not exist. Must still be refused.
    const outcome = await answer(await sourcePrompt(), "pick-source:Lottery", "Lottery");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });
});

// ── Skip / cancel ─────────────────────────────────────────────────────────

describe("handleValidationFollowUp — skip and cancel", () => {
  function prompt() {
    return startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );
  }

  it("writes nothing when the user skips", async () => {
    const outcome = await answer(await prompt(), "skip");

    expect(outcome.status).toBe("cancelled");
    expect(outcome.success).toBe(false);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(mockExpenseCreate).not.toHaveBeenCalled();
    expect(mockBudgetUpsert).not.toHaveBeenCalled();
  });

  it("confirms the cancellation in the reply", async () => {
    const outcome = await answer(await prompt(), "skip");

    expect(outcome.status).toBe("cancelled");
    expect(outcome.reply).toMatch(/cancel/i);
  });

  it("uses the copy the user asked for", async () => {
    const outcome = await answer(await prompt(), "skip");

    expect(outcome.reply).toContain("Transaction cancelled by you..!");
  });

  it("clears the session so the next message starts clean", async () => {
    const outcome = await answer(await prompt(), "skip");

    expect(outcome.context!.validation.session).toBeNull();
  });

  it("writes nothing even after a field was already answered", async () => {
    // Row 1 is complete; row 2 still needs a category. Answering row 2's
    // category would complete the batch, so instead we confirm nothing was
    // written while the question was still open, then skip and confirm the
    // completed row was never persisted on its own either.
    const first = await startValidation(
      USER,
      [
        { kind: "EXPENSE", amount: 300, date: "2026-03-01", category: "Needs", subcategory: "Snacks" },
        { kind: "EXPENSE", amount: 200 },
      ],
      "spent 300 on snacks on 2026-03-01 and 200 on something",
    );

    expect(first.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();

    const afterSkip = await answer(first, "skip");
    expect(afterSkip.status).toBe("cancelled");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(mockExpenseCreate).not.toHaveBeenCalled();
  });

  it("ignores an action the open prompt never offered", async () => {
    // Regression guard: a date action arriving at the category step used to be
    // filed verbatim as the subcategory, writing "2026-03-01" as a category.
    const prompt = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );

    const outcome = await answer(prompt, "pick-date", "2026-03-01");

    expect(outcome.status).toBe("prompt");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(
      outcome.context!.validation.session.operations.every((op: any) => op.subcategory === "Snacks"),
    ).toBe(true);
  });
});

// ── Budget mode consent ───────────────────────────────────────────────────

describe("budget mode consent", () => {
  function budgetRequest() {
    return startValidation(USER, [{ kind: "BUDGET_UPDATE", amount: 30000 }], "set my budget to 30000");
  }

  it("asks a free-mode user before switching them into budget mode", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: "no-limit", monthlyLimit: 0 });

    const outcome = await budgetRequest();

    expect(outcome.status).toBe("prompt");
    expect(outcome.reply).toMatch(/budget mode/i);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("treats a null expenseMode as free mode and still asks", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: null, monthlyLimit: 0 });

    const outcome = await budgetRequest();

    expect(outcome.status).toBe("prompt");
    expect(mockBudgetUpsert).not.toHaveBeenCalled();
  });

  it("does not ask a user who is already in budget mode", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: "limit", monthlyLimit: 20000 });

    const outcome = await budgetRequest();

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch).toHaveBeenCalledTimes(1);
  });

  it("approves the mode change only on an explicit yes", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: "no-limit", monthlyLimit: 0 });

    const outcome = await answer(await budgetRequest(), "budget-mode-confirm", "yes");

    expect(outcome.status).toBe("executed");
    expect(mockExecuteOperationsBatch).toHaveBeenCalledWith(
      USER,
      expect.any(Array),
      expect.any(String),
      { approvedBudgetMode: true },
    );
  });

  it("changes nothing when the user declines", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: "no-limit", monthlyLimit: 0 });

    const outcome = await answer(await budgetRequest(), "budget-mode-confirm", "no");

    expect(outcome.status).toBe("cancelled");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(mockBudgetUpsert).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("keeps the existing mode out of the write when consent is not required", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: "limit", monthlyLimit: 20000 });

    await budgetRequest();

    expect(mockExecuteOperationsBatch).toHaveBeenCalledWith(
      USER,
      expect.any(Array),
      expect.any(String),
      { approvedBudgetMode: false },
    );
  });

  it("lets the user skip the mode question entirely", async () => {
    mockUserFindUnique.mockResolvedValue({ expenseMode: "no-limit", monthlyLimit: 0 });

    const outcome = await answer(await budgetRequest(), "skip");

    expect(outcome.status).toBe("cancelled");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });
});

// ── Session integrity ─────────────────────────────────────────────────────

describe("session ownership", () => {
  it("rejects a session belonging to another user", async () => {
    const prompt = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    const session = prompt.context!.validation.session;
    const outcome = await handleValidationFollowUp(OTHER_USER, session, "pick-date", "2026-03-01");

    expect(outcome.status).toBe("cancelled");
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("drops a foreign session at the route boundary too", async () => {
    const prompt = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    const context = { validation: { session: prompt.context!.validation.session } };
    expect(readValidationSession(context, OTHER_USER)).toBeNull();
    expect(readValidationSession(context, USER)).not.toBeNull();
  });

  it("ignores a malformed context instead of throwing", () => {
    expect(readValidationSession(undefined, USER)).toBeNull();
    expect(readValidationSession({}, USER)).toBeNull();
    expect(readValidationSession({ validation: {} }, USER)).toBeNull();
    expect(readValidationSession({ validation: { session: "nope" } }, USER)).toBeNull();
  });

  it("expires an abandoned session without writing", async () => {
    const prompt = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks",
    );

    const session = prompt.context!.validation.session;
    session.expiresAt = new Date(Date.now() - 60 * 1000).toISOString();

    const outcome = await handleValidationFollowUp(USER, session, "pick-date", "2026-03-01");

    expect(outcome.status).toBe("cancelled");
    expect(outcome.reply).toMatch(/timed out/i);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });
});

// ── Reply quality ─────────────────────────────────────────────────────────

describe("success replies", () => {
  it("links back to the expense history", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );

    expect(outcome.status).toBe("executed");
    expect(outcome.reply).toMatch(/\/expenses/);
  });

  it("names the resolved date and category rather than echoing the request", async () => {
    const outcome = await startValidation(
      USER,
      [{ kind: "EXPENSE", amount: 300, date: "2026-03-01", category: "Needs", subcategory: "Snacks" }],
      "spent 300 on snacks on 2026-03-01",
    );

    expect(outcome.reply).toMatch(/Snacks/);
  });

  it("sends an income confirmation to the income history, not the expense history", async () => {
    // Regression guard: the reply always offered the expense history, so adding
    // income told the user to look on a page that cannot show the entry.
    const outcome = await startValidation(
      USER,
      [{ kind: "INCOME", amount: 900, date: "2026-03-01", source: "Salary" }],
      "received 900 salary on 2026-03-01",
    );

    expect(outcome.status).toBe("executed");
    expect(outcome.reply).toMatch(/\/income/);
    expect(outcome.reply).not.toMatch(/\/expenses/);
  });

  it("does not offer the income history when only an expense was logged", async () => {
    const outcome = await startValidation(
      USER,
      [completeExpense()],
      "spent 300 on snacks on 2026-03-01",
    );

    expect(outcome.reply).toMatch(/\/expenses/);
    expect(outcome.reply).not.toMatch(/\/income/);
  });

  it("offers both histories when the batch mixes expenses and income", async () => {
    const outcome = await startValidation(
      USER,
      [
        { kind: "EXPENSE", amount: 300, date: "2026-03-01", category: "Needs", subcategory: "Snacks" },
        { kind: "INCOME", amount: 900, date: "2026-03-01", source: "Salary" },
      ],
      "spent 300 on snacks and received 900 salary on 2026-03-01",
    );

    expect(outcome.reply).toMatch(/\/expenses/);
    expect(outcome.reply).toMatch(/\/income/);
  });

  it("does not claim an expense or income history for a budget-only change", async () => {
    // The budget lives on the dashboard; there is no expense history entry to
    // go and look at.
    const outcome = await startValidation(
      USER,
      [{ kind: "BUDGET_UPDATE", amount: 30000 }],
      "set my monthly budget to 30000",
    );

    expect(outcome.status).toBe("executed");
    expect(outcome.reply).not.toMatch(/\/expenses/);
    expect(outcome.reply).not.toMatch(/\/income/);
    expect(outcome.reply).toMatch(/\/dashboard/);
  });
});