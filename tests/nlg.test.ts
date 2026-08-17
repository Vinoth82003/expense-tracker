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

const { mockFetchExpenses, mockFetchBudget, mockFetchIncome, mockFetchCategories } = vi.hoisted(() => ({
  mockFetchExpenses: vi.fn(),
  mockFetchBudget: vi.fn(),
  mockFetchIncome: vi.fn(),
  mockFetchCategories: vi.fn(),
}));
vi.mock("@/lib/chat/v1/api-gateway", () => ({
  fetchExpenses: mockFetchExpenses,
  fetchBudget: mockFetchBudget,
  fetchIncome: mockFetchIncome,
  fetchCategories: mockFetchCategories,
}));

import {
  isGrounded,
  computeExpenseSummaryFacts,
  phraseResponse,
  phraseExpenseSummary,
  computeIncomeSummaryFacts,
  phraseIncomeSummary,
  computeSavingsInsightsFacts,
  phraseSavingsInsights,
  computeCategoryQueryFacts,
  phraseCategoryQuery,
  computeComparisonFacts,
  phraseComparisonSummary,
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

describe("computeIncomeSummaryFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there are no incomes", async () => {
    mockFetchIncome.mockResolvedValue({ incomes: [] });

    const facts = await computeIncomeSummaryFacts(
      makeRequest(),
      "how much did I earn",
    );

    expect(facts).toBeNull();
  });

  it("computes total and top sources", async () => {
    mockFetchIncome.mockResolvedValue({
      incomes: [
        { amount: "30000", source: "Salary" },
        { amount: "5000", source: "Freelance" },
        { amount: "2000", source: "Salary" },
      ],
    });

    const facts = await computeIncomeSummaryFacts(
      makeRequest(),
      "how much did I earn this month",
    );

    expect(facts).toMatchObject({
      total: 37000,
      incomeCount: 3,
      topSources: ["Salary", "Freelance"],
    });
    expect(facts?.label).toMatch(/^\w+ \d{4}$/);
    expect(facts?.topSources).toHaveLength(2);
  });
});

describe("phraseIncomeSummary", () => {
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
    mockFetchIncome.mockResolvedValue({ incomes: [{ amount: "5000", source: "Salary" }] });

    const reply = await phraseIncomeSummary(makeRequest(), "how much did I earn", "u1");
    expect(reply).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("phrases a grounded income summary", async () => {
    mockFetchIncome.mockResolvedValue({
      incomes: [{ amount: "50000", source: "Salary" }],
    });
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You earned **₹50000** this month from Salary." },
        { usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } },
      ]),
    );

    const reply = await phraseIncomeSummary(makeRequest(), "how much did I earn", "u1");
    expect(reply).toBe("You earned **₹50000** this month from Salary.");
  });

  it("falls back to null when the phrasing invents a number", async () => {
    mockFetchIncome.mockResolvedValue({
      incomes: [{ amount: "50000", source: "Salary" }],
    });
    mockCreate.mockResolvedValueOnce(
      chunkStream([{ delta: "You earned **₹99999** this month." }]),
    );

    const reply = await phraseIncomeSummary(makeRequest(), "how much did I earn", "u1");
    expect(reply).toBeNull();
  });
});

describe("computeSavingsInsightsFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no data", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });
    mockFetchIncome.mockResolvedValue({ incomes: [] });
    mockFetchBudget.mockResolvedValue({ limit: 0, expenseMode: "standard" });

    const facts = await computeSavingsInsightsFacts(makeRequest(), "savings insights");
    expect(facts).toBeNull();
  });

  it("computes totals and budget usage in limit mode", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [{ amount: "6000", category: "Food" }] });
    mockFetchIncome.mockResolvedValue({ incomes: [{ amount: "50000", source: "Salary" }] });
    mockFetchBudget.mockResolvedValue({ limit: 20000, expenseMode: "limit" });

    const facts = await computeSavingsInsightsFacts(makeRequest(), "am I on track");

    expect(facts).toMatchObject({
      label: "this month",
      totalSpent: 6000,
      totalIncome: 50000,
      budgetLimit: 20000,
      budgetUsagePercent: 30,
      remaining: 14000,
      expenseMode: "limit",
    });
    expect(facts?.dailyAverage).toBeGreaterThan(0);
  });

  it("computes savings in no-limit mode without budget fields", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [{ amount: "20000", category: "Food" }] });
    mockFetchIncome.mockResolvedValue({ incomes: [{ amount: "50000", source: "Salary" }] });
    mockFetchBudget.mockResolvedValue({ limit: 0, expenseMode: "no-limit" });

    const facts = await computeSavingsInsightsFacts(makeRequest(), "savings");

    expect(facts).toMatchObject({
      totalSpent: 20000,
      totalIncome: 50000,
      savings: 30000,
      expenseMode: "no-limit",
    });
    expect(facts?.budgetLimit).toBeUndefined();
  });
});

describe("phraseSavingsInsights", () => {
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

  it("phrases a grounded savings insight", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [{ amount: "6000", category: "Food" }] });
    mockFetchIncome.mockResolvedValue({ incomes: [{ amount: "50000", source: "Salary" }] });
    mockFetchBudget.mockResolvedValue({ limit: 20000, expenseMode: "limit" });
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You're at **₹6000** this month (30% of your ₹20000 budget)." },
        { usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 } },
      ]),
    );

    const reply = await phraseSavingsInsights(makeRequest(), "savings", "u1");
    expect(reply).toBe("You're at **₹6000** this month (30% of your ₹20000 budget).");
  });

  it("falls back to null when the phrasing invents a number", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [{ amount: "6000", category: "Food" }] });
    mockFetchIncome.mockResolvedValue({ incomes: [{ amount: "50000", source: "Salary" }] });
    mockFetchBudget.mockResolvedValue({ limit: 20000, expenseMode: "limit" });
    mockCreate.mockResolvedValueOnce(
      chunkStream([{ delta: "You saved **₹999999** this month." }]),
    );

    const reply = await phraseSavingsInsights(makeRequest(), "savings", "u1");
    expect(reply).toBeNull();
  });
});

describe("computeCategoryQueryFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCategories.mockResolvedValue({
      categories: [
        { name: "Food", type: "Wants" },
        { name: "Rent", type: "Needs" },
      ],
    });
  });

  it("returns null when there are no user categories", async () => {
    mockFetchCategories.mockResolvedValue({ categories: [] });

    const facts = await computeCategoryQueryFacts(makeRequest(), "how much on food");
    expect(facts).toBeNull();
  });

  it("returns null when the category cannot be matched", async () => {
    const facts = await computeCategoryQueryFacts(makeRequest(), "zzz unknowncat");
    expect(facts).toBeNull();
  });

  it("returns null when there are no matching expenses", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });

    const facts = await computeCategoryQueryFacts(makeRequest(), "how much did I spend on food");
    expect(facts).toBeNull();
  });

  it("computes total and count for a matched category", async () => {
    mockFetchExpenses.mockResolvedValue({
      expenses: [
        { amount: "1200", category: "Food" },
        { amount: "800", category: "Food" },
      ],
    });

    const facts = await computeCategoryQueryFacts(
      makeRequest(),
      "how much did I spend on food",
    );

    expect(facts).toMatchObject({
      category: "Food",
      total: 2000,
      count: 2,
    });
  });
});

describe("phraseCategoryQuery", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    mockCreate.mockReset();
    mockFetchCategories.mockResolvedValue({
      categories: [{ name: "Food", type: "Wants" }],
    });
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("phrases a grounded category query", async () => {
    mockFetchExpenses.mockResolvedValue({
      expenses: [{ amount: "1200", category: "Food", subcategory: "Food" }],
    });
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You spent **₹1200** on Food this month across 1 transaction." },
        { usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 } },
      ]),
    );

    const reply = await phraseCategoryQuery(makeRequest(), "how much on food", "u1");
    expect(reply).toBe("You spent **₹1200** on Food this month across 1 transaction.");
  });

  it("falls back to null when ungrounded", async () => {
    mockFetchExpenses.mockResolvedValue({
      expenses: [{ amount: "1200", category: "Food", subcategory: "Food" }],
    });
    mockCreate.mockResolvedValueOnce(
      chunkStream([{ delta: "You spent **₹5555** on Food." }]),
    );

    const reply = await phraseCategoryQuery(makeRequest(), "how much on food", "u1");
    expect(reply).toBeNull();
  });
});

describe("computeComparisonFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no data at all", async () => {
    mockFetchExpenses.mockResolvedValue({ expenses: [] });

    const facts = await computeComparisonFacts(makeRequest(), "compare this month to last");
    expect(facts).toBeNull();
  });

  it("computes both-month totals and direction", async () => {
    // First call = current month, second = last month
    mockFetchExpenses
      .mockResolvedValueOnce({ expenses: [{ amount: "6000" }] })
      .mockResolvedValueOnce({ expenses: [{ amount: "4000" }] });

    const facts = await computeComparisonFacts(makeRequest(), "compare this month to last");

    expect(facts).toMatchObject({
      currentTotal: 6000,
      lastTotal: 4000,
      diff: 2000,
      direction: "more",
    });
    expect(facts?.pctChange).toBe("50.0");
    expect(facts?.label).toMatch(/Compared to \w+/);
  });
});

describe("phraseComparisonSummary", () => {
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

  it("phrases a grounded comparison", async () => {
    mockFetchExpenses
      .mockResolvedValueOnce({ expenses: [{ amount: "6000" }] })
      .mockResolvedValueOnce({ expenses: [{ amount: "4000" }] });
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "This month you spent **₹6000** — **50.0% more** than last month (**₹4000**)." },
        { usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 } },
      ]),
    );

    const reply = await phraseComparisonSummary(makeRequest(), "compare this month to last", "u1");
    expect(reply).toBe(
      "This month you spent **₹6000** — **50.0% more** than last month (**₹4000**).",
    );
  });

  it("falls back to null when ungrounded", async () => {
    mockFetchExpenses
      .mockResolvedValueOnce({ expenses: [{ amount: "6000" }] })
      .mockResolvedValueOnce({ expenses: [{ amount: "4000" }] });
    mockCreate.mockResolvedValueOnce(
      chunkStream([{ delta: "You spent **₹99999** this month." }]),
    );

    const reply = await phraseComparisonSummary(makeRequest(), "compare", "u1");
    expect(reply).toBeNull();
  });
});
