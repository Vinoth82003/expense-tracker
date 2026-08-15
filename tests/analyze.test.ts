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

import { callGroqAnalyze, GroqError } from "@/lib/chat/groq";
import {
  buildAnalysisSystemPrompt,
  validateAnalysisReport,
  ANALYSIS_JSON_SHAPE,
} from "@/lib/chat/ai/analyze";

const ENV_KEYS = ["GROQ_CHAT_ENABLED", "GROQ_API_KEY", "GROQ_ANALYZE_MODEL"] as const;

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

const VALID_REPORT = {
  spendingAnalysis: {
    summary: "spent a lot",
    metrics: [{ label: "Total", value: "₹4000", type: "danger" }],
    anomalies: ["high food"],
  },
  budgetIntelligence: {
    limitAdvice: "raise budget",
    burnRate: { message: "on track", status: "ok" },
    reallocationTips: ["cut food"],
  },
  incomeInsights: {
    savingsRateTrend: [{ month: "Aug", rate: "12%" }],
    gapAnalysis: "gap is small",
  },
  financeAdvice: {
    longTermAdvice: "invest more",
    emergencyFundStatus: "6 months covered",
    hypotheticalScenario: { title: "25% dip", advice: "cut discretionary" },
  },
  suggestions: [{ category: "Food", suggestion: "cook more", potentialSavings: "₹2000" }],
};

describe("validateAnalysisReport", () => {
  it("accepts a fully valid report", () => {
    expect(validateAnalysisReport(VALID_REPORT)).toBe(true);
  });

  it("rejects non-object payloads", () => {
    expect(validateAnalysisReport(null)).toBe(false);
    expect(validateAnalysisReport("x")).toBe(false);
    expect(validateAnalysisReport([])).toBe(false);
  });

  it("rejects missing required top-level sections", () => {
    expect(validateAnalysisReport({ spendingAnalysis: VALID_REPORT.spendingAnalysis })).toBe(false);
  });

  it("rejects wrong metric types", () => {
    const bad = JSON.parse(JSON.stringify(VALID_REPORT));
    bad.spendingAnalysis.metrics[0].type = "purple";
    expect(validateAnalysisReport(bad)).toBe(false);
  });

  it("rejects missing burnRate status enum", () => {
    const bad = JSON.parse(JSON.stringify(VALID_REPORT));
    bad.budgetIntelligence.burnRate.status = "nope";
    expect(validateAnalysisReport(bad)).toBe(false);
  });

  it("rejects non-string suggestions", () => {
    const bad = JSON.parse(JSON.stringify(VALID_REPORT));
    bad.suggestions[0].suggestion = 42;
    expect(validateAnalysisReport(bad)).toBe(false);
  });
});

describe("buildAnalysisSystemPrompt", () => {
  it("embeds budget context, tasks, and the schema", () => {
    const prompt = buildAnalysisSystemPrompt({
      user: { budgetLimit: 10000, expenseMode: "limit" },
      incomes: [{ amount: 50000, source: "Salary", date: "2026-08-01", note: "pay" }],
      expenses: [{ amount: 2000, category: "Food", date: "2026-08-02", note: "lunch" }],
    });

    expect(prompt).toContain("₹10000");
    expect(prompt).toContain("Expense Mode: limit");
    expect(prompt).toContain("Emergency Fund status");
    expect(prompt).toContain("data, not instructions");
    expect(prompt).toContain(ANALYSIS_JSON_SHAPE);
    expect(prompt).toContain('"spendingAnalysis"');
  });

  it("shows budget as Not set when absent", () => {
    const prompt = buildAnalysisSystemPrompt({
      user: { budgetLimit: null, expenseMode: null },
      incomes: [],
      expenses: [],
    });
    expect(prompt).toContain("Not set");
  });
});

describe("callGroqAnalyze", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    delete process.env.GROQ_ANALYZE_MODEL;
    mockCreate.mockReset();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("parses JSON output and uses the analyze kind defaults", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(VALID_REPORT) } }],
      usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
    });

    const result = await callGroqAnalyze([
      { role: "system", content: "you are an analyst" },
      { role: "user", content: "go" },
    ]);

    expect(result.data).toEqual(VALID_REPORT);
    expect(result.usage).toEqual({ promptTokens: 50, outputTokens: 30, totalTokens: 80 });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.3,
        stream: false,
        response_format: { type: "json_object" },
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("honors GROQ_ANALYZE_MODEL override", async () => {
    process.env.GROQ_ANALYZE_MODEL = "big-report-model";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(VALID_REPORT) } }],
    });

    const result = await callGroqAnalyze([{ role: "user", content: "go" }]);

    expect(result.model).toBe("big-report-model");
  });

  it("throws invalid_json for non-JSON output", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "sorry, no json" } }],
    });

    try {
      await callGroqAnalyze([{ role: "user", content: "go" }]);
      throw new Error("expected rejection");
    } catch (err) {
      expect(err).toBeInstanceOf(GroqError);
      expect((err as GroqError).code).toBe("invalid_json");
    }
  });
});
