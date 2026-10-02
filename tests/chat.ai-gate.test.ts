import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

// Verifies the admin AI kill-switch is actually wired into the chat route:
// a denied policy short-circuits before the body is parsed, before any model
// call, and surfaces the reason to the client. The allow/deny matrix lives in
// tests/ai-access.test.ts.
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: async () => null,
  checkUserRateLimit: async () => null,
  rateLimiter: () => null,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { mockCheckAiAccess, mockGroqCreate } = vi.hoisted(() => ({
  mockCheckAiAccess: vi.fn(),
  mockGroqCreate: vi.fn(),
}));

const { mockExtractFinancialIntent, mockExecuteOperationsBatch, mockExecuteQuery } =
  vi.hoisted(() => ({
    mockExtractFinancialIntent: vi.fn(),
    mockExecuteOperationsBatch: vi.fn(),
    mockExecuteQuery: vi.fn(),
  }));

vi.mock("@/lib/ai/access", () => ({ checkAiAccess: mockCheckAiAccess }));
vi.mock("groq-sdk", () => ({
  default: class {
    chat = { completions: { create: mockGroqCreate } };
  },
}));

// Sage v2 multi-transaction pipeline — asserted here to prove the admin
// kill-switch short-circuits before the extractor and before any writer.
vi.mock("@/lib/chat/v2/batch-extractor", () => ({
  extractFinancialIntent: mockExtractFinancialIntent,
}));
vi.mock("@/lib/chat/v2/batch-executor", () => ({
  executeOperationsBatch: mockExecuteOperationsBatch,
  executeQuery: mockExecuteQuery,
}));

const { POST } = await import("../app/api/chat/route");
const { getServerSession } = await import("next-auth");

const TEST_USER_ID = "64a1f9c7b6d8e5a3f1c0b2a1";

function postRequest() {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "I spent 200 on lunch" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (getServerSession as unknown as Mock).mockResolvedValue({
    user: { email: "gate@example.com", id: TEST_USER_ID },
  });
});

describe("Chat API — admin AI kill-switch wiring", () => {
  it("returns 403 with the reason and a Sage-branded fallback reply", async () => {
    mockCheckAiAccess.mockResolvedValue({
      allowed: false,
      status: 403,
      error: "Sage AI is temporarily unavailable. We are upgrading Sage AI for better performance and will be back soon.",
    });

    const response = await POST(postRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    // `error` stays the short telemetry string; `reply` is the user-facing
    // fallback the chat panel renders as a normal Sage message.
    expect(body.error).toMatch(/Sage AI is temporarily unavailable/i);
    expect(body.reply).toMatch(/disabled by the administrator/i);
    expect(body.reply).toMatch(/expense tracking keeps working/i);
    expect(body.success).toBe(false);
    expect(body.aiDisabled).toBe(true);
    expect(mockCheckAiAccess).toHaveBeenCalledWith(TEST_USER_ID, "chat");
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it("returns 429 with a quota-specific fallback reply when the daily cap is exhausted", async () => {
    mockCheckAiAccess.mockResolvedValue({
      allowed: false,
      status: 429,
      error: "Daily AI limit reached. You can run 5 AI requests per day.",
    });

    const response = await POST(postRequest());
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toMatch(/Daily AI limit reached/);
    expect(body.reply).toMatch(/daily AI message limit/i);
    expect(body.reply).toMatch(/come back tomorrow/i);
    expect(body.success).toBe(false);
    expect(body.aiDisabled).toBe(true);
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it("checks the policy after auth, so an unauthenticated caller still gets 401", async () => {
    (getServerSession as unknown as Mock).mockResolvedValue(null);

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(mockCheckAiAccess).not.toHaveBeenCalled();
  });

  it("never reaches the extractor or any writer when Sage is disabled", async () => {
    mockCheckAiAccess.mockResolvedValue({
      allowed: false,
      status: 403,
      error: "Sage AI is temporarily unavailable.",
    });

    await POST(postRequest());

    expect(mockExtractFinancialIntent).not.toHaveBeenCalled();
    expect(mockExecuteOperationsBatch).not.toHaveBeenCalled();
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });
});