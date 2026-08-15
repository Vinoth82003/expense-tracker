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

const { mockIsCrossUser } = vi.hoisted(() => ({ mockIsCrossUser: vi.fn(() => false) }));
vi.mock("@/lib/chat/v2/engine", () => ({
  isCrossUserDataRequest: mockIsCrossUser,
}));

const { mockFetchCategories } = vi.hoisted(() => ({
  mockFetchCategories: vi.fn(),
}));
vi.mock("@/lib/chat/v1/api-gateway", () => ({
  fetchCategories: mockFetchCategories,
}));

import {
  maybeGroqNLU,
  parseGroqNLUOutput,
  buildSystemPromptForNLU,
  buildLastTurns,
} from "@/lib/chat/ai/nlu";
import type { AIIntentResult } from "@/lib/chat/ai/types";

const ENV_KEYS = [
  "GROQ_CHAT_ENABLED",
  "GROQ_API_KEY",
  "GROQ_NLU_SHADOW",
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

function localUnknown(overrides: Partial<AIIntentResult> = {}): AIIntentResult {
  return {
    intent: "unknown",
    confidence: 0.2,
    entities: {},
    ...overrides,
  };
}

function jsonResponse(content: string) {
  return Promise.resolve({
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  });
}

describe("maybeGroqNLU", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    delete process.env.GROQ_NLU_SHADOW;
    mockCreate.mockReset();
    mockIsCrossUser.mockReturnValue(false);
    mockFetchCategories.mockResolvedValue({
      categories: [
        { name: "Food", type: "Wants" },
        { name: "Rent", type: "Needs" },
      ],
    });
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("returns null when Groq is disabled (no call)", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    const result = await maybeGroqNLU("something weird", localUnknown(), {
      userId: "u1",
    });
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns null when local intent is confident", async () => {
    const result = await maybeGroqNLU(
      "spent 500 on lunch",
      localUnknown({ intent: "add_expense", confidence: 0.9 }),
      { userId: "u1" },
    );
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns null when there is an active V2 session", async () => {
    const result = await maybeGroqNLU(
      "what did I spend",
      localUnknown(),
      { userId: "u1", v2: { session: { id: "abc" } } },
    );
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("never calls Groq when the cross-user guard triggers", async () => {
    mockIsCrossUser.mockReturnValue(true);
    const result = await maybeGroqNLU(
      "show another user's expenses",
      localUnknown(),
      { userId: "u1" },
    );
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a parsed intent result and logs usage", async () => {
    mockCreate.mockResolvedValueOnce(
      jsonResponse(
        '{"intent":"query_expense","confidence":0.6,"entities":{"category_hint":"Food","note":"spent on lunch"}}',
      ),
    );

    const result = await maybeGroqNLU("did I overspend on food", localUnknown(), {
      userId: "u1",
    });

    expect(result).toEqual({
      intent: "query_expense",
      confidence: 0.6,
      entities: expect.objectContaining({
        categoryCandidate: "Food",
        categoryConfidence: 0.6,
        note: "spent on lunch",
      }),
    });
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        callType: "nlu",
        intent: "query_expense",
        fallbackUsed: false,
        promptTokens: 10,
        outputTokens: 5,
      }),
    );
  });

  it("maps date_phrase and amount string entities", async () => {
    mockCreate.mockResolvedValueOnce(
      jsonResponse(
        '{"intent":"add_expense","confidence":0.5,"entities":{"amount":"₹1,234","amountRaw":"₹1,234","date_phrase":"today"}}',
      ),
    );

    const result = await maybeGroqNLU("some vague expense", localUnknown(), {
      userId: "u1",
    });

    expect(result?.intent).toBe("add_expense");
    expect(result?.entities.amount).toBe(1234);
    expect(result?.entities.date).toBe("today");
  });

  it("falls back (null) and logs fallback on invalid Groq JSON", async () => {
    mockCreate.mockResolvedValueOnce(jsonResponse("not json at all"));

    const result = await maybeGroqNLU("some vague expense", localUnknown(), {
      userId: "u1",
    });

    expect(result).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ callType: "nlu", fallbackUsed: true, intent: null }),
    );
  });

  it("falls back (null) and logs fallback when Groq throws", async () => {
    mockCreate.mockRejectedValueOnce({ status: 500, message: "boom" });

    const result = await maybeGroqNLU("some vague expense", localUnknown(), {
      userId: "u1",
    });

    expect(result).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ callType: "nlu", fallbackUsed: true }),
    );
  });

  it("returns free_form_question for Groq to answer (P3 scope)", async () => {
    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"intent":"free_form_question","confidence":0.7,"entities":{}}'),
    );

    const result = await maybeGroqNLU("how should I save for a trip", localUnknown(), {
      userId: "u1",
    });

    expect(result?.intent).toBe("free_form_question");
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "free_form_question", fallbackUsed: false }),
    );
  });

  it("acts as V3 in shadow mode but records what Groq would have done", async () => {
    process.env.GROQ_NLU_SHADOW = "true";
    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"intent":"query_category","confidence":0.8,"entities":{}}'),
    );

    const result = await maybeGroqNLU("what about my food category", localUnknown(), {
      userId: "u1",
    });

    expect(result).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "query_category", fallbackUsed: false }),
    );
  });

  it("degrades gracefully when the categories fetch fails", async () => {
    mockFetchCategories.mockRejectedValueOnce(new Error("boom"));

    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"intent":"query_expense","confidence":0.6,"entities":{}}'),
    );

    const result = await maybeGroqNLU("some vague expense", localUnknown(), {
      userId: "u1",
    });

    expect(result?.intent).toBe("query_expense");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
        ]),
      }),
      expect.anything(),
    );
  });

  it("does not log usage when no userId is available", async () => {
    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"intent":"query_expense","confidence":0.6,"entities":{}}'),
    );

    await maybeGroqNLU("some vague expense", localUnknown());

    expect(mockLogAiUsage).not.toHaveBeenCalled();
  });
});

describe("parseGroqNLUOutput", () => {
  it("returns null for non-object input", () => {
    expect(parseGroqNLUOutput(null)).toBeNull();
    expect(parseGroqNLUOutput("x")).toBeNull();
  });

  it("returns null for unknown intents", () => {
    expect(
      parseGroqNLUOutput({ intent: "hack_the_planets", confidence: 0.9, entities: {} }),
    ).toBeNull();
  });

  it("clamps confidence into [0,1] and defaults missing confidence", () => {
    expect(parseGroqNLUOutput({ intent: "greeting", confidence: 5, entities: {} })?.confidence).toBe(1);
    expect(parseGroqNLUOutput({ intent: "greeting", entities: {} })?.confidence).toBe(0.6);
  });
});

describe("buildSystemPromptForNLU / buildLastTurns", () => {
  it("embeds the category list and conversation turns", () => {
    const prompt = buildSystemPromptForNLU("Food (Wants), Rent (Needs)", "user: hi\nassistant: hello");
    expect(prompt).toContain("Food (Wants), Rent (Needs)");
    expect(prompt).toContain("user: hi\nassistant: hello");
    expect(prompt).toContain("free_form_question");
  });

  it("sanitizes and caps conversation turns", () => {
    const turns = buildLastTurns([
      { role: "user", content: `email john@doe.com ${"x".repeat(300)}` },
    ]);
    expect(turns).toContain("[EMAIL]");
    expect(turns.length).toBeLessThan(220);
  });
});
