import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

// Verifies the Sage v2 LLM-first pipeline end to end through /api/chat:
// extractFinancialIntent -> startValidation (missing-field prompts) ->
// executeOperationsBatch / executeQuery.
// The extractor, executor and validation module are themselves unit-tested in
// tests/sage-v2-batch-extractor.test.ts, tests/sage-v2-batch-executor.test.ts
// and tests/chat-validation.test.ts — this file only asserts the wiring.

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: async () => null,
  checkUserRateLimit: async () => null,
  rateLimiter: () => null,
}));
vi.mock("@/lib/pii", () => ({ sanitizePii: (s: string) => s }));
vi.mock("groq-sdk", () => ({
  default: class {
    chat = { completions: { create: vi.fn() } };
  },
}));

const { mockCategoryFindMany, mockExpenseCreate, mockIncomeCreate } = vi.hoisted(() => ({
  mockCategoryFindMany: vi.fn(),
  mockExpenseCreate: vi.fn(),
  mockIncomeCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: mockCategoryFindMany },
    expense: { create: mockExpenseCreate, findMany: vi.fn(async () => []) },
    income: { create: mockIncomeCreate, findMany: vi.fn(async () => []) },
    user: { findUnique: vi.fn() },
  },
}));

const {
  mockCheckAiAccess,
  mockExtractFinancialIntent,
  mockExecuteOperationsBatch,
  mockExecuteQuery,
  mockStartValidation,
  mockHandleValidationFollowUp,
} = vi.hoisted(() => ({
  mockCheckAiAccess: vi.fn(),
  mockExtractFinancialIntent: vi.fn(),
  mockExecuteOperationsBatch: vi.fn(),
  mockExecuteQuery: vi.fn(),
  mockStartValidation: vi.fn(),
  mockHandleValidationFollowUp: vi.fn(),
}));

vi.mock("@/lib/ai/access", () => ({ checkAiAccess: mockCheckAiAccess }));
vi.mock("@/lib/chat/v2/batch-extractor", () => ({
  extractFinancialIntent: mockExtractFinancialIntent,
}));
vi.mock("@/lib/chat/v2/batch-executor", () => ({
  executeOperationsBatch: mockExecuteOperationsBatch,
  executeQuery: mockExecuteQuery,
}));
vi.mock("@/lib/chat/v2/validation", async () => {
  const actual = await vi.importActual<typeof import("@/lib/chat/v2/validation")>(
    "@/lib/chat/v2/validation",
  );
  return {
    ...actual,
    startValidation: mockStartValidation,
    handleValidationFollowUp: mockHandleValidationFollowUp,
  };
});

const { POST } = await import("../app/api/chat/route");
const { getServerSession } = await import("next-auth");

const TEST_USER_ID = "64a1f9c7b6d8e5a3f1c0b2a1";

function postRequest(message: string, extra: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...extra }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (getServerSession as unknown as Mock).mockResolvedValue({
    user: { email: "sage@example.com", id: TEST_USER_ID },
  });
  mockCheckAiAccess.mockResolvedValue({ allowed: true });
  mockCategoryFindMany.mockResolvedValue([
    { name: "Groceries" },
    { name: "Rent" },
    { name: "Food" },
  ]);
  mockExecuteOperationsBatch.mockResolvedValue({
    success: true,
    reply: "Logged 3 expenses totaling ₹6,000.",
    createdExpenses: [{ id: "e1" }],
    createdIncomes: [],
    updatedBudget: null,
    eventType: "batchTransactionsAdded",
    data: { expenses: [{ id: "e1" }], incomes: [], budget: null },
  });
});

describe("Chat API — Sage v2 multi-transaction batch", () => {
  it("routes a transaction batch through validation instead of writing immediately", async () => {
    const operations = [
      { kind: "EXPENSE", amount: 3000, subcategory: "Groceries" },
      { kind: "EXPENSE", amount: 2000, subcategory: "Rent" },
      { kind: "EXPENSE", amount: 1000, subcategory: "Food" },
    ];
    mockExtractFinancialIntent.mockResolvedValue({
      type: "TRANSACTION_BATCH",
      reply: "Logged 3 expenses totaling ₹6,000.",
      operations,
    });
mockStartValidation.mockResolvedValue({
      reply: "What date were these on?",
      success: false,
      status: "prompt",
      followUp: { type: "validation_followup", payload: { options: [] } },
      context: { validation: { session: { id: "s1" } } },
    });

const response = await POST(postRequest("3000 on grocery, 2000 on rent, 1000 on food"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.validationStatus).toBe("prompt");
    expect(body.followUp.type).toBe("validation_followup");
// The executor must not run until the session is complete.
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    // The raw message, not the extractor's prose: deterministic date detection
    // reads the user's original words, so the model's phrasing cannot lose a date.
    expect(mockStartValidation).toHaveBeenCalledWith(
      TEST_USER_ID,
      operations,
      "3000 on grocery, 2000 on rent, 1000 on food",
    );
  });

  it("passes the user's available categories into the extractor prompt", async () => {
    mockExtractFinancialIntent.mockResolvedValue({
      type: "FREEFORM",
      reply: "The 50/30/20 rule puts half toward needs.",
    });

    await POST(postRequest("what is the 50/30/20 rule?"));

    expect(mockExtractFinancialIntent).toHaveBeenCalledTimes(1);
    const [message, userId, categories] = mockExtractFinancialIntent.mock.calls[0];
    expect(message).toBe("what is the 50/30/20 rule?");
    expect(userId).toBe(TEST_USER_ID);
    expect(categories).toEqual(["Groceries", "Rent", "Food"]);
  });

  it("routes a QUERY intent to executeQuery without writing anything", async () => {
    mockExtractFinancialIntent.mockResolvedValue({
      type: "QUERY",
      reply: "Checking...",
      queryKind: "EXPENSE_SUMMARY",
    });
    mockExecuteQuery.mockResolvedValue("This month you have spent ₹6,000.");

    const response = await POST(postRequest("how much did I spend this month?"));
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.reply).toMatch(/6,000/);
    expect(mockExecuteQuery).toHaveBeenCalledWith(TEST_USER_ID, "EXPENSE_SUMMARY", undefined);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("forwards the category filter on a CATEGORY_BREAKDOWN query", async () => {
    mockExtractFinancialIntent.mockResolvedValue({
      type: "QUERY",
      reply: "Checking...",
      queryKind: "CATEGORY_BREAKDOWN",
      queryParam: "Food",
    });
    mockExecuteQuery.mockResolvedValue("You have spent ₹1,000 on Food.");

    await POST(postRequest("what did I spend on food?"));

    expect(mockExecuteQuery).toHaveBeenCalledWith(TEST_USER_ID, "CATEGORY_BREAKDOWN", "Food");
  });

  it("returns a GREETING reply without touching any writer", async () => {
    mockExtractFinancialIntent.mockResolvedValue({
      type: "GREETING",
      reply: "Hi there! I'm Sage, your personal financial assistant.",
    });

    const response = await POST(postRequest("hi"));
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.reply).toMatch(/Sage/i);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it("does not execute a batch the extractor reported as empty", async () => {
    mockExtractFinancialIntent.mockResolvedValue({
      type: "TRANSACTION_BATCH",
      reply: "Nothing to log.",
      operations: [],
    });

    await POST(postRequest("spent nothing at all"));

    // The route guards on operations?.length, so an empty batch must not
    // reach the executor and must not open a transaction.
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("surfaces the extractor's graceful-downgrade message when AI is unreachable", async () => {
    mockExtractFinancialIntent.mockResolvedValue({
      type: "UNKNOWN",
      reply: "Sage AI is temporarily unavailable. We are upgrading Sage AI for better performance and will be back soon.",
      degraded: true,
    });

    const response = await POST(postRequest("spent 100 on food"));
    const body = await response.json();

    expect(body.reply).toMatch(/temporarily unavailable/i);
    expect(body.success).toBe(false);
    expect(body.aiUnavailable).toBe(true);
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it("falls through to the legacy engine for a genuine unknown, not a degradation", async () => {
    // No `degraded` flag — the model simply did not understand. The route must
    // still let the legacy path try rather than short-circuiting.
    mockExtractFinancialIntent.mockResolvedValue({
      type: "UNKNOWN",
      reply: "I could not understand your request.",
    });

    await POST(postRequest("asdfgh"));

    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
  });

  it("skips the extractor for follow-up form submissions", async () => {
    await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: { amount: 100 }, intentType: "add_expense" }),
      }),
    );

    expect(mockExtractFinancialIntent).not.toHaveBeenCalled();
  });

  it("answers a validation prompt without re-running the extractor", async () => {
    // The draft already exists in the session; a date answer must not be
    // re-parsed as a fresh message.
mockHandleValidationFollowUp.mockResolvedValue({
      reply: "Logged 3 expenses totaling ₹6,000.",
      success: true,
      status: "executed",
      operations: [{ id: "e1" }],
      eventType: "batchTransactionsAdded",
    });

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: { sessionId: "s1", actionId: "pick-date", value: "2026-03-05" },
          intentType: "validation_followup",
          message: "2026-03-05",
          context: { validation: { session: { id: "s1", userId: TEST_USER_ID, missing: [], operations: [] } } },
        }),
      }),
    );
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.validationStatus).toBe("executed");
    expect(mockExtractFinancialIntent).not.toHaveBeenCalled();
    expect(mockHandleValidationFollowUp).toHaveBeenCalledTimes(1);
  });

  it("does not answer a validation prompt that carries no session", async () => {
    // Without a session there is no draft to amend — refusing is correct, since
    // inventing one could write a half-filled transaction.
    await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: { actionId: "pick-date", value: "2026-03-05" },
          intentType: "validation_followup",
        }),
      }),
    );

    expect(mockHandleValidationFollowUp).not.toHaveBeenCalled();
  });
});

