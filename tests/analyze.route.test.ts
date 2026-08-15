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

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}));

vi.mock("next-auth/next", () => ({ getServerSession: mockGetServerSession }));

const {
  mockSettingsFindMany,
  mockReportCount,
  mockExpenseFindMany,
  mockIncomeFindMany,
  mockUserFindUnique,
  mockReportCreate,
  mockAiUsageLogCreate,
} = vi.hoisted(() => ({
  mockSettingsFindMany: vi.fn(),
  mockReportCount: vi.fn(),
  mockExpenseFindMany: vi.fn(),
  mockIncomeFindMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockReportCreate: vi.fn(),
  mockAiUsageLogCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: { findMany: mockSettingsFindMany },
    report: {
      count: mockReportCount,
      create: mockReportCreate,
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    expense: { findMany: mockExpenseFindMany },
    income: { findMany: mockIncomeFindMany },
    user: { findUnique: mockUserFindUnique },
    aiUsageLog: { create: mockAiUsageLogCreate },
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/analyze/route";

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

const ENV_KEYS = ["GROQ_CHAT_ENABLED", "GROQ_API_KEY", "GEMINI_API_KEY"] as const;

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

function setupDataMocks() {
  mockSettingsFindMany.mockResolvedValue([
    { key: "featureFlags", value: JSON.stringify({ aiAnalysis: true }) },
    { key: "aiSettings", value: JSON.stringify({ maxReports: 3 }) },
  ]);
  mockReportCount.mockResolvedValue(0);
  mockExpenseFindMany.mockResolvedValue([
    { amount: 4000, category: "Food", subcategory: "Dining", date: new Date(), note: "lunch" },
  ]);
  mockIncomeFindMany.mockResolvedValue([]);
  mockUserFindUnique.mockResolvedValue({ monthlyLimit: 10000, expenseMode: "limit", name: "Test" });
  mockReportCreate.mockResolvedValue({});
  mockAiUsageLogCreate.mockResolvedValue({});
}

function postRequest() {
  return new NextRequest("http://localhost/api/analyze", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/analyze", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    mockCreate.mockReset();
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "t@example.com" },
    });
    setupDataMocks();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("uses Groq and persists real tokens/cost when enabled", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(VALID_REPORT) } }],
      usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(VALID_REPORT);

    expect(mockReportCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "SUCCESS",
        tokens: 80,
        cost: expect.any(Number),
      }),
    });
    expect(mockAiUsageLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        callType: "analyze",
        intent: "analysis_report",
        fallbackUsed: false,
        promptTokens: 50,
        outputTokens: 30,
      }),
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("falls back to Gemini when Groq output is invalid, persisting V3 zeros", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not json at all" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_REPORT) });

    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(VALID_REPORT);

    expect(mockReportCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "SUCCESS", tokens: 0, cost: 0 }),
    });
    expect(mockAiUsageLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ callType: "analyze", fallbackUsed: true }),
    });
  });

  it("uses Gemini (V3) untouched when Groq is disabled", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_REPORT) });

    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(VALID_REPORT);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockReportCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ tokens: 0, cost: 0 }),
    });
  });

  it("respects the aiAnalysis feature flag regardless of provider", async () => {
    mockSettingsFindMany.mockResolvedValue([
      { key: "featureFlags", value: JSON.stringify({ aiAnalysis: false }) },
      { key: "aiSettings", value: JSON.stringify({ maxReports: 3 }) },
    ]);

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("enforces the daily report quota", async () => {
    mockReportCount.mockResolvedValue(3);

    const response = await POST(postRequest());

    expect(response.status).toBe(429);
  });
});
