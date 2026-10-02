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

vi.mock("@/lib/ai/access", () => ({ checkAiAccess: mockCheckAiAccess }));
vi.mock("groq-sdk", () => ({
  default: class {
    chat = { completions: { create: mockGroqCreate } };
  },
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
  it("returns 403 with the reason when the flag is off", async () => {
    mockCheckAiAccess.mockResolvedValue({
      allowed: false,
      status: 403,
      error: "Sage Assistant is currently disabled by the administrator.",
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Sage Assistant is currently disabled by the administrator.",
    });
    expect(mockCheckAiAccess).toHaveBeenCalledWith(TEST_USER_ID, "chat");
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it("returns 429 when the daily AI cap is exhausted", async () => {
    mockCheckAiAccess.mockResolvedValue({
      allowed: false,
      status: 429,
      error: "Daily AI limit reached. You can run 5 AI requests per day.",
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(429);
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it("checks the policy after auth, so an unauthenticated caller still gets 401", async () => {
    (getServerSession as unknown as Mock).mockResolvedValue(null);

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(mockCheckAiAccess).not.toHaveBeenCalled();
  });
});