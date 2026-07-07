import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleChatV2 } from "@/lib/chat/v2/engine";

function makeRequest() {
  return new Request("http://localhost/api/chat", {
    headers: {
      cookie: "next-auth.session-token=test",
    },
  });
}

describe("chat v2 budget updates", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost";
  });

  it.each([
    "set budget 28,000",
    "set my budget 28,000",
    "update my budget 28,000",
  ])("updates budget for: %s", async (message) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        budget: { month: "2026-07", amount: 28000 },
      }),
    });
    global.fetch = fetchMock;

    const result = await handleChatV2({
      body: { message },
      userId: "user-1",
      request: makeRequest(),
    });

    expect(result.handled).toBe(true);
    if (!result.handled) return;
    expect(result.success).toBe(true);
    expect(result.eventType).toBe("budgetUpdated");
    expect(result.reply).toContain("28000.00");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost/api/budget");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      month: expect.any(String),
      limit: 28000,
    });
  });

  it("keeps budget status prompts on the read-only path", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/api/budget")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ limit: 25000 }),
        });
      }
      if (url.includes("/api/expenses")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ expenses: [{ amount: 5000, subcategory: "Food" }] }),
        });
      }
      if (url.includes("/api/income")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ income: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    const result = await handleChatV2({
      body: { message: "show my budget" },
      userId: "user-1",
      request: makeRequest(),
    });

    expect(result.handled).toBe(true);
    if (!result.handled) return;
    expect(result.eventType).toBeUndefined();
    expect(result.reply).toContain("Budget:");
    expect(fetchMock).not.toHaveBeenCalledWith(
      "http://localhost/api/budget",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
