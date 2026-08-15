import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockCreate } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  return { mockCreate };
});

vi.mock("groq-sdk", () => {
  class MockGroq {
    chat = { completions: { create: mockCreate } };
  }
  return { default: MockGroq };
});

const { mockLogAiUsage } = vi.hoisted(() => ({ mockLogAiUsage: vi.fn() }));
vi.mock("@/lib/chat/ai/usage", () => ({ logAiUsage: mockLogAiUsage }));

const { mockFetchExpenses, mockFetchIncome, mockFetchBudget } = vi.hoisted(() => ({
  mockFetchExpenses: vi.fn(),
  mockFetchIncome: vi.fn(),
  mockFetchBudget: vi.fn(),
}));
vi.mock("@/lib/chat/v1/api-gateway", () => ({
  fetchExpenses: mockFetchExpenses,
  fetchIncome: mockFetchIncome,
  fetchBudget: mockFetchBudget,
}));

import {
  answerFreeFormQuestion,
  computeFreeFormFacts,
} from "@/lib/chat/ai/freeform";

const ENV_KEYS = ["GROQ_CHAT_ENABLED", "GROQ_API_KEY"] as const;

function snapshotEnv() {
  return Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
}

function restoreEnv(snap: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    const v = snap[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function makeRequest() {
  return new Request("http://localhost/api/chat");
}

function chunkStream(chunks: Array<{ delta?: string; usage?: object }>) {
  return (async function* () {
    for (const c of chunks) {
      yield {
        choices: c.delta ? [{ delta: { content: c.delta } }] : [],
        usage: c.usage,
      };
    }
  })();
}

function mockMonthData() {
  mockFetchExpenses.mockResolvedValue({
    expenses: [
      { amount: "2000", category: "Food" },
      { amount: "1200", category: "Rent" },
      { amount: "800", category: "Food" },
    ],
  });
  mockFetchIncome.mockResolvedValue({
    incomes: [{ amount: "50000", source: "Salary" }],
  });
  mockFetchBudget.mockResolvedValue({ limit: 20000, expenseMode: "limit" });
}

describe("computeFreeFormFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no data this month", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });
    mockFetchIncome.mockResolvedValue({ incomes: [] });
    mockFetchBudget.mockResolvedValue({ limit: 0, expenseMode: "standard" });

    const facts = await computeFreeFormFacts(makeRequest());
    expect(facts).toBeNull();
  });

  it("computes totals, top categories, and budget usage", async () => {
    mockMonthData();

    const facts = await computeFreeFormFacts(makeRequest());

    expect(facts).toMatchObject({
      totalSpent: 4000,
      totalIncome: 50000,
      expenseCount: 3,
      incomeCount: 1,
      topCategories: [
        { name: "Food", amount: 2800 },
        { name: "Rent", amount: 1200 },
      ],
      budgetLimit: 20000,
      budgetUsagePercent: 20,
    });
  });

  it("omits budget fields when no budget is set", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [{ amount: "500", category: "Food" }] });
    mockFetchIncome.mockResolvedValue({ incomes: [] });
    mockFetchBudget.mockResolvedValue({ limit: 0, expenseMode: "standard" });

    const facts = await computeFreeFormFacts(makeRequest());

    expect(facts?.budgetLimit).toBeUndefined();
    expect(facts?.budgetUsagePercent).toBeUndefined();
  });
});

describe("answerFreeFormQuestion", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    mockCreate.mockReset();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("returns null when Groq is disabled (V3 path untouched)", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    const reply = await answerFreeFormQuestion({
      userId: "u1",
      request: makeRequest(),
      message: "how should I save?",
    });
    expect(reply).toBeNull();
    expect(mockFetchExpenses).not.toHaveBeenCalled();
  });

  it("returns null without calling Groq when there is no data", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });
    mockFetchIncome.mockResolvedValue({ incomes: [] });

    const reply = await answerFreeFormQuestion({
      userId: "u1",
      request: makeRequest(),
      message: "how should I save?",
    });

    expect(reply).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a grounded answer and logs usage", async () => {
    mockMonthData();
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You spent **₹4000** this month across " },
        { delta: "**Food** (₹2800) and **Rent** (₹1200)." },
        { usage: { prompt_tokens: 30, completion_tokens: 12, total_tokens: 42 } },
      ]),
    );

    const reply = await answerFreeFormQuestion({
      userId: "u1",
      request: makeRequest(),
      message: "where did my money go?",
    });

    expect(reply).toBe("You spent **₹4000** this month across **Food** (₹2800) and **Rent** (₹1200).");
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        callType: "nlg",
        intent: "free_form_question",
        fallbackUsed: false,
        promptTokens: 30,
        outputTokens: 12,
      }),
    );
  });

  it("falls back (null) when the answer invents a number", async () => {
    mockMonthData();
    mockCreate.mockResolvedValueOnce(
      chunkStream([{ delta: "You should save **₹99999** next month." }]),
    );

    const reply = await answerFreeFormQuestion({
      userId: "u1",
      request: makeRequest(),
      message: "how much should I save?",
    });

    expect(reply).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "free_form_question", fallbackUsed: true }),
    );
  });

  it("falls back (null) when Groq throws", async () => {
    mockMonthData();
    mockCreate.mockRejectedValueOnce({ status: 500, message: "boom" });

    const reply = await answerFreeFormQuestion({
      userId: "u1",
      request: makeRequest(),
      message: "how should I save?",
    });

    expect(reply).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "free_form_question", fallbackUsed: true }),
    );
  });

  it("redacts PII from the question before it reaches the prompt", async () => {
    mockMonthData();
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "Good question." },
        { usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 } },
      ]),
    );

    await answerFreeFormQuestion({
      userId: "u1",
      request: makeRequest(),
      message: "email me at john.doe@example.com please",
    });

    const userMessage = mockCreate.mock.calls[0][0].messages[1];
    expect(userMessage.content).toContain("[EMAIL]");
    expect(userMessage.content).not.toContain("john.doe@example.com");
  });
});
