import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockCreate, mockClass } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  class MockGroq {
    chat = { completions: { create: mockCreate } };
  }
  return { mockCreate, mockClass: MockGroq };
});

vi.mock("groq-sdk", () => ({ default: mockClass }));

import {
  callGroqNLU,
  callGroqNLG,
  GroqError,
  isGroqChatEnabled,
} from "@/lib/chat/groq";
import type { GroqErrorCode } from "@/lib/chat/groq";

const ENV_KEYS = [
  "GROQ_CHAT_ENABLED",
  "GROQ_API_KEY",
  "GROQ_CHAT_MODEL",
  "GROQ_ANALYZE_MODEL",
] as const;

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

async function expectGroqCode(promise: Promise<unknown>, code: GroqErrorCode) {
  try {
    await promise;
    throw new Error("expected rejection");
  } catch (err) {
    expect(err).toBeInstanceOf(GroqError);
    expect((err as GroqError).code).toBe(code);
  }
}

async function* chunkStream(
  chunks: Array<{ delta?: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>,
) {
  for (const c of chunks) {
    yield {
      choices: c.delta ? [{ delta: { content: c.delta } }] : [],
      usage: c.usage,
    };
  }
}

describe("groq provider", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    delete process.env.GROQ_CHAT_MODEL;
    delete process.env.GROQ_ANALYZE_MODEL;
    mockCreate.mockReset();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("isGroqChatEnabled reflects the flag and its truthy variants", () => {
    delete process.env.GROQ_CHAT_ENABLED;
    expect(isGroqChatEnabled()).toBe(false);
    process.env.GROQ_CHAT_ENABLED = "0";
    expect(isGroqChatEnabled()).toBe(false);
    process.env.GROQ_CHAT_ENABLED = "true";
    expect(isGroqChatEnabled()).toBe(true);
    process.env.GROQ_CHAT_ENABLED = "TRUE";
    expect(isGroqChatEnabled()).toBe(true);
    process.env.GROQ_CHAT_ENABLED = "1";
    expect(isGroqChatEnabled()).toBe(true);
  });

  it("fails closed when the feature flag is disabled", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    await expectGroqCode(
      callGroqNLU([{ role: "user", content: "hi" }]),
      "disabled",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("fails closed when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;
    await expectGroqCode(
      callGroqNLU([{ role: "user", content: "hi" }]),
      "missing_api_key",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("parses and returns NLU JSON with usage metadata", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"intent":"add_expense","amount":75}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
    });

    const result = await callGroqNLU([{ role: "user", content: "spent 75" }]);

    expect(result.data).toEqual({ intent: "add_expense", amount: 75 });
    expect(result.usage).toEqual({ promptTokens: 10, outputTokens: 4, totalTokens: 14 });
    expect(result.model).toBe("llama-3.3-70b-versatile");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: "json_object" },
        temperature: 0,
        stream: false,
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("honors GROQ_CHAT_MODEL override", async () => {
    process.env.GROQ_CHAT_MODEL = "custom-model";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"ok":true}' } }],
    });

    const result = await callGroqNLU([{ role: "user", content: "hi" }]);

    expect(result.model).toBe("custom-model");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "custom-model" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws invalid_json when NLU output is not JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "sorry, no json" } }],
    });

    await expectGroqCode(
      callGroqNLU([{ role: "user", content: "hi" }]),
      "invalid_json",
    );
  });

  it("streams NLG deltas and aggregates usage", async () => {
    mockCreate.mockResolvedValue(
      chunkStream([
        { delta: "Hello" },
        { delta: " world" },
        { usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 } },
      ]),
    );

    const deltas: string[] = [];
    const result = await callGroqNLG(
      [{ role: "user", content: "say hi" }],
      (d) => deltas.push(d),
    );

    expect(deltas).toEqual(["Hello", " world"]);
    expect(result.content).toBe("Hello world");
    expect(result.usage).toEqual({ promptTokens: 5, outputTokens: 2, totalTokens: 7 });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ stream: true }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("times out after the configured budget", async () => {
    mockCreate.mockImplementation(
      (_body: unknown, _options: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          _options?.signal?.addEventListener("abort", () => reject(new Error("AbortError")));
        }),
    );

    await expectGroqCode(
      callGroqNLU([{ role: "user", content: "hi" }], { timeoutMs: 25 }),
      "timeout",
    );
  });

  it("maps provider HTTP errors to GroqError http", async () => {
    mockCreate.mockRejectedValue({ status: 500, message: "boom" });

    try {
      await callGroqNLG([{ role: "user", content: "hi" }]);
      throw new Error("expected rejection");
    } catch (err) {
      expect(err).toBeInstanceOf(GroqError);
      expect((err as GroqError).code).toBe("http");
      expect((err as GroqError).status).toBe(500);
    }
  });
});
