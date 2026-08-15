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

const { mockFetchExpenses, mockFetchBudget } = vi.hoisted(() => ({
  mockFetchExpenses: vi.fn(),
  mockFetchBudget: vi.fn(),
}));
vi.mock("@/lib/chat/v1/api-gateway", () => ({
  fetchExpenses: mockFetchExpenses,
  fetchBudget: mockFetchBudget,
}));

import {
  isGrounded,
  computeExpenseSummaryFacts,
  phraseResponse,
  phraseExpenseSummary,
} from "@/lib/chat/ai/nlg";

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

const SAMPLE_FACTS = {
  label: "August 2026",
  total: 4200,
  topCategories: [{ name: "Food", amount: 2100 }],
  budgetLimit: 10000,
  budgetUsagePercent: 42,
};

describe("isGrounded", () => {
  it("accepts a reply using only fact numbers", () => {
    const reply = "You spent **₹4200** in August 2026. • **Food** — ₹2100 (42%).";
    expect(isGrounded(reply, SAMPLE_FACTS)).toBe(true);
  });

  it("rejects a reply with an invented number", () => {
    const reply = "You spent **₹9999** in August 2026.";
    expect(isGrounded(reply, SAMPLE_FACTS)).toBe(false);
  });

  it("handles comma grouping and rounded decimals", () => {
    expect(isGrounded("total was ₹4,200.00", SAMPLE_FACTS)).toBe(true);
    expect(isGrounded("total was ₹4,200", SAMPLE_FACTS)).toBe(true);
  });

  it("rejects empty or numeric-free replies", () => {
    expect(isGrounded("", SAMPLE_FACTS)).toBe(false);
    expect(isGrounded("let me think about it", SAMPLE_FACTS)).toBe(true);
  });
});

describe("computeExpenseSummaryFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there are no expenses", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });
    mockFetchBudget.mockResolvedValue({ limit: 10000, expenseMode: "limit" });

    const facts = await computeExpenseSummaryFacts(
      makeRequest(),
      "how much did I spend",
    );

    expect(facts).toBeNull();
  });

  it("computes total and top categories with budget usage for current month", async () => {
    mockFetchExpenses.mockResolvedValue({
      expenses: [
        { amount: "2100", category: "Food", subcategory: "Dining" },
        { amount: "1200", category: "Rent" },
        { amount: "900", category: "Food" },
        { amount: "0", category: "Other" },
      ],
    });
    mockFetchBudget.mockResolvedValue({ limit: 10000, expenseMode: "limit" });

    const facts = await computeExpenseSummaryFacts(
      makeRequest(),
      "how much did I spend this month",
    );

    expect(facts).toEqual({
      label: expect.stringMatching(/^\w+ \d{4}$/),
      total: 4200,
      topCategories: [
        { name: "Dining", amount: 2100 },
        { name: "Rent", amount: 1200 },
        { name: "Food", amount: 900 },
      ],
      budgetLimit: 10000,
      budgetUsagePercent: 42,
    });
  });

  it("omits budget fields for non-current ranges", async () => {
    mockFetchExpenses.mockResolvedValue({
      expenses: [{ amount: "500", category: "Food" }],
    });
    mockFetchBudget.mockResolvedValue({ limit: 10000, expenseMode: "limit" });

    const facts = await computeExpenseSummaryFacts(
      makeRequest(),
      "what did I spend yesterday",
    );

    expect(facts).toMatchObject({ total: 500 });
    expect(facts?.budgetLimit).toBeUndefined();
    expect(facts?.budgetUsagePercent).toBeUndefined();
  });
});

describe("phraseResponse", () => {
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

  it("returns null when Groq is disabled", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    const reply = await phraseResponse("query_expense", SAMPLE_FACTS, {
      message: "how much did I spend",
    });
    expect(reply).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a grounded phrased reply and logs usage", async () => {
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You spent **₹4200** in August 2026." },
        { delta: " • **Food** — ₹2100 (42%)." },
        { usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 } },
      ]),
    );

    const reply = await phraseResponse("query_expense", SAMPLE_FACTS, {
      message: "how much did I spend",
      userId: "u1",
    });

    expect(reply).toBe("You spent **₹4200** in August 2026. • **Food** — ₹2100 (42%).");
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        callType: "nlg",
        intent: "query_expense",
        fallbackUsed: false,
        promptTokens: 20,
        outputTokens: 10,
      }),
    );
  });

  it("falls back (null) when the phrasing invents a number", async () => {
    mockCreate.mockResolvedValueOnce(
      chunkStream([{ delta: "You spent **₹9999** total." }]),
    );

    const reply = await phraseResponse("query_expense", SAMPLE_FACTS, {
      message: "how much did I spend",
      userId: "u1",
    });

    expect(reply).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "query_expense", fallbackUsed: true }),
    );
  });

  it("falls back (null) when Groq throws", async () => {
    mockCreate.mockRejectedValueOnce({ status: 500, message: "boom" });

    const reply = await phraseResponse("query_expense", SAMPLE_FACTS, {
      message: "how much did I spend",
      userId: "u1",
    });

    expect(reply).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "query_expense", fallbackUsed: true }),
    );
  });
});

describe("phraseExpenseSummary", () => {
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

  it("returns null when Groq is disabled (V3 template path untouched)", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    const reply = await phraseExpenseSummary(makeRequest(), "how much did I spend", "u1");
    expect(reply).toBeNull();
    expect(mockFetchExpenses).not.toHaveBeenCalled();
  });

  it("returns null without calling Groq when there is nothing to summarize", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });

    const reply = await phraseExpenseSummary(makeRequest(), "how much did I spend", "u1");

    expect(reply).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("phrases a grounded expense summary", async () => {
    mockFetchExpenses.mockResolvedValue({
      expenses: [{ amount: "4200", category: "Food" }],
    });
    mockFetchBudget.mockResolvedValue({ limit: 0, expenseMode: "standard" });
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You're at **₹4200** this month." },
        { usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } },
      ]),
    );

    const reply = await phraseExpenseSummary(makeRequest(), "how much did I spend", "u1");

    expect(reply).toBe("You're at **₹4200** this month.");
    expect(mockFetchExpenses).toHaveBeenCalled();
  });
});
