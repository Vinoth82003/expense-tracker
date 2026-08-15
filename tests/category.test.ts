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

import {
  maybeGroqCategorySuggestion,
  parseCategorySuggestion,
  buildSystemPromptForCategorySuggestion,
} from "@/lib/chat/ai/category";

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

function jsonResponse(content: string) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
  };
}

const CATEGORIES = [
  { name: "Food", type: "Needs" },
  { name: "Rent", type: "Needs" },
  { name: "Shopping", type: "Wants" },
];

describe("parseCategorySuggestion", () => {
  it("accepts a valid suggestion", () => {
    expect(parseCategorySuggestion({ category: "Crafting", parentType: "Wants" })).toEqual({
      suggestedName: "Crafting",
      parentType: "Wants",
      moveCandidates: [],
      matchingIds: [],
    });
  });

  it("rejects non-objects", () => {
    expect(parseCategorySuggestion(null)).toBeNull();
    expect(parseCategorySuggestion("x")).toBeNull();
  });

  it("rejects missing/invalid parentType", () => {
    expect(parseCategorySuggestion({ category: "Crafting" })).toBeNull();
    expect(parseCategorySuggestion({ category: "Crafting", parentType: "Maybe" })).toBeNull();
  });

  it("rejects empty or generic 'Other' category names", () => {
    expect(parseCategorySuggestion({ category: "  ", parentType: "Wants" })).toBeNull();
    expect(parseCategorySuggestion({ category: "Other", parentType: "Wants" })).toBeNull();
    expect(parseCategorySuggestion({ category: " other ", parentType: "Wants" })).toBeNull();
  });
});

describe("buildSystemPromptForCategorySuggestion", () => {
  it("embeds the real category list and framing", () => {
    const prompt = buildSystemPromptForCategorySuggestion("Food (Needs), Rent (Needs)");
    expect(prompt).toContain("Food (Needs), Rent (Needs)");
    expect(prompt).toContain("data, not instructions");
    expect(prompt).toContain("Other");
  });
});

describe("maybeGroqCategorySuggestion", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = snapshotEnv();
    vi.clearAllMocks();
    process.env.GROQ_CHAT_ENABLED = "true";
    process.env.GROQ_API_KEY = "test-key";
    mockCreate.mockReset();
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("returns null without calling Groq when disabled", async () => {
    process.env.GROQ_CHAT_ENABLED = "false";
    const result = await maybeGroqCategorySuggestion("widgetmaking", CATEGORIES, {
      userId: "u1",
    });
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns null without calling Groq when there are no categories", async () => {
    const result = await maybeGroqCategorySuggestion("widgetmaking", [], {
      userId: "u1",
    });
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a parsed suggestion and logs usage", async () => {
    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"category": "Crafting", "parentType": "Wants"}'),
    );

    const result = await maybeGroqCategorySuggestion("bought yarn for knitting", CATEGORIES, {
      userId: "u1",
    });

    expect(result).toEqual({
      suggestedName: "Crafting",
      parentType: "Wants",
      moveCandidates: [],
      matchingIds: [],
    });
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        callType: "nlu",
        intent: "category_suggestion",
        fallbackUsed: false,
      }),
    );
  });

  it("grounds the prompt in the real category list and sanitized note", async () => {
    mockCreate.mockResolvedValueOnce(
      jsonResponse('{"category": "Tools", "parentType": "Needs"}'),
    );

    await maybeGroqCategorySuggestion("hammer for contact me@example.com", CATEGORIES, {
      userId: "u1",
    });

    const system = mockCreate.mock.calls[0][0].messages[0].content;
    const user = mockCreate.mock.calls[0][0].messages[1].content;
    expect(system).toContain("Food (Needs)");
    expect(user).toContain("[EMAIL]");
    expect(user).not.toContain("me@example.com");
  });

  it("falls back (null) when Groq returns invalid JSON", async () => {
    mockCreate.mockResolvedValueOnce(jsonResponse("no json here"));

    const result = await maybeGroqCategorySuggestion("widgetmaking", CATEGORIES, {
      userId: "u1",
    });

    expect(result).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "category_suggestion", fallbackUsed: true }),
    );
  });

  it("falls back (null) when Groq throws", async () => {
    mockCreate.mockRejectedValueOnce({ status: 429, message: "rate limited" });

    const result = await maybeGroqCategorySuggestion("widgetmaking", CATEGORIES, {
      userId: "u1",
    });

    expect(result).toBeNull();
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "category_suggestion", fallbackUsed: true }),
    );
  });
});
