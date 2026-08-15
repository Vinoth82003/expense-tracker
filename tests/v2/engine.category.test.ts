import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

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

import { handleChatV2 } from "@/lib/chat/v2/engine";

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
  return new Request("http://localhost/api/chat", {
    headers: { cookie: "next-auth.session-token=test" },
  });
}

function jsonResponse(content: string) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 30, completion_tokens: 6, total_tokens: 36 },
  };
}

describe("V2 Engine — Groq category fallback (§5.5)", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.restoreAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost";
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    mockCreate.mockReset();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("proposes a Groq category via the existing suggest_new_category session", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            categories: [
              { id: "c1", name: "Food", type: "Needs" },
              { id: "c2", name: "Transport", type: "Needs" },
            ],
          }),
        });
      }
      if (url.includes("/api/expenses")) {
        return Promise.resolve({ ok: true, json: async () => ({ expenses: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"category": "Crafting", "parentType": "Wants"}'),
    );

    const result = await handleChatV2({
      body: { message: "spent 500 on widgetmaking today", context: { v2: { session: null } } },
      userId: "user-1",
      request: makeRequest(),
    });

    expect(result.handled).toBe(true);
    if (!result.handled) return;
    expect(result.followUp?.payload?.prompt).toContain("Crafting");
    expect(result.followUp?.payload?.kind).toBe("choices");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("skips Groq entirely when disabled → V3 choose_expense_category flow", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => ({ categories: [] }) });
      }
      if (url.includes("/api/expenses")) {
        return Promise.resolve({ ok: true, json: async () => ({ expenses: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    const result = await handleChatV2({
      body: { message: "spent 500 on widgetmaking today", context: { v2: { session: null } } },
      userId: "user-1",
      request: makeRequest(),
    });

    expect(result.handled).toBe(true);
    if (!result.handled) return;
    expect(result.followUp?.payload?.prompt).toMatch(/not confident enough/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
