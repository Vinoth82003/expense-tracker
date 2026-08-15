import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { handleChatV2 } from "@/lib/chat/v2/engine";

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

function expensesForThisMonth() {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-05`;
  return [
    { amount: 4200, subcategory: "Food", date },
    { amount: 800, subcategory: "Transport", date },
  ];
}

describe("V2 Engine — NLG grounding fallback live path (§5.3)", () => {
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

  it("falls back to the V3 template when Groq's NLG inventes an ungrounded number", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/expenses")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ expenses: expensesForThisMonth() }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    // Groq attempts phrasing but emits a total (₹9999) that is NOT in the
    // facts payload (₹4200 / ₹800) → isGrounded rejects it → phraseResponse
    // returns null → engine falls back to the V3 template.
    mockCreate.mockResolvedValueOnce(
      chunkStream([
        { delta: "You spent **₹9999** total this month (Food 4200, Transport 800)." },
        { usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } },
      ]),
    );

    const result = await handleChatV2({
      body: { message: "how much did I spend this month", context: { v2: { session: null } } },
      userId: "user-1",
      request: makeRequest(),
    });

    expect(result.handled).toBe(true);
    if (!result.handled) return;

    expect(mockCreate).toHaveBeenCalledTimes(1);
    // Template facts render, the invented figure does not.
    expect(result.reply).toContain("₹4200");
    expect(result.reply).not.toContain("₹9999");
  });
});
