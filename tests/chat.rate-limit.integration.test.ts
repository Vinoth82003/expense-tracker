import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { NextResponse } from "next/server";

// Integration test for the chat route's rate-limit guardrail (P0, VULN-011).
// tests/security/remediation.test.ts proves createRateLimiter blocks the
// request at the threshold; this proves the CHAT ROUTE actually calls
// checkRateLimit / checkUserRateLimit and surfaces the 429 to the client —
// the wiring that was missing in V3 (VULN-011: route returned null).
// we mock the route's limiter import (@/lib/rateLimit) with a deterministic
// in-memory counter so the test is stable in sandboxes with an unreachable
// REDIS_URI configured.
const store = new Map<string, { count: number }>();

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: async (
    _request: Request,
    maxRequests: number,
    _windowMs: number,
    key?: string,
  ) => {
    const ip = "rate-limit-integration-test";
    const identifier = key ? `${key}:${ip}` : ip;
    const entry = store.get(identifier) ?? { count: 0 };
    entry.count++;
    store.set(identifier, entry);
    if (entry.count > maxRequests) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    return null;
  },
  checkUserRateLimit: async () => null,
  rateLimiter: () => null,
}));

const TEST_USER_ID = "64a1f9c7b6d8e5a3f1c0b2a1"; // 24-byte ObjectId shape

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/chat/intent", () => ({ getChatIntent: vi.fn() }));

const { POST } = await import("../app/api/chat/route");
const { getServerSession } = await import("next-auth");
const { getChatIntent } = await import("@/lib/chat/intent");

function postRequest(message: string) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "rate-limit-integration-test",
    },
    body: JSON.stringify({ message }),
  });
}

describe("Chat API — rate limiting guardrail (VULN-011, end-to-end)", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    (getServerSession as unknown as Mock).mockResolvedValue({
      user: { email: "rl@example.com", id: TEST_USER_ID },
    });
    (getChatIntent as unknown as Mock).mockReturnValue({ type: "unknown" });
  });

  it("serves the first N messages and blocks the (N+1)th with 429", async () => {
    // Read after the route import so .env (loaded via the real next-auth import
    // chain) has been picked up into process.env.
    const limit = Number(process.env.CHAT_RATE_LIMIT_MAX || 20);
    const statuses: number[] = [];
    for (let i = 1; i <= limit + 1; i++) {
      const response = await POST(postRequest(`ping ${i}`));
      statuses.push(response.status);
      if (i <= limit) expect(response.status).not.toBe(429);
    }
    expect(statuses[statuses.length - 1]).toBe(429);
  }, 15000);
});
