import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCallGroqNLU, mockLogAiUsage } = vi.hoisted(() => ({
  mockCallGroqNLU: vi.fn(),
  mockLogAiUsage: vi.fn(),
}));

vi.mock("@/lib/chat/groq", () => ({
  callGroqNLU: mockCallGroqNLU,
  isGroqChatEnabled: () => true,
  GroqRole: {},
}));

vi.mock("@/lib/chat/ai/usage", () => ({ logAiUsage: mockLogAiUsage }));

vi.mock("@google/genai", () => ({ GoogleGenAI: vi.fn() }));

import {
  extractFinancialIntent,
  type ParsedOperation,
  type OperationKind,
  type QueryKind,
} from "@/lib/chat/v2/batch-extractor";

function groqReturns(payload: unknown) {
  mockCallGroqNLU.mockResolvedValue({
    content: JSON.stringify(payload),
    data: payload,
    usage: { promptTokens: 10, outputTokens: 20 },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.GEMINI_API_KEY;
  // vitest does not load .env, so the Groq branch is unlocked explicitly here.
  process.env.GROQ_API_KEY = "test-groq-key";
});

describe("extractFinancialIntent — greeting short-circuit", () => {
  it("greets without calling any model", async () => {
    const res = await extractFinancialIntent("hi", "u1");

    expect(res.type).toBe("GREETING");
    expect(res.reply).toMatch(/Sage/i);
    expect(mockCallGroqNLU).not.toHaveBeenCalled();
  });

  it("rejects an empty or PII-only message", async () => {
    const res = await extractFinancialIntent("   ", "u1");

    expect(res.type).toBe("UNKNOWN");
    expect(res.reply).toMatch(/enter a message/i);
    expect(mockCallGroqNLU).not.toHaveBeenCalled();
  });
});

describe("extractFinancialIntent — multi-transaction batches", () => {
  it("parses three expenses from one message", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "Logged 3 expenses.",
      operations: [
        { kind: "EXPENSE", amount: 3000, category: "Needs", subcategory: "Groceries", note: "grocery" },
        { kind: "EXPENSE", amount: 2000, category: "Needs", subcategory: "Rent", note: "rent" },
        { kind: "EXPENSE", amount: 1000, category: "Wants", subcategory: "Food", note: "food" },
      ],
    });

    const res = await extractFinancialIntent(
      "3000 on grocery, 2000 on rent, 1000 on food",
      "u1",
    );

    expect(res.type).toBe("TRANSACTION_BATCH");
    expect(res.operations).toHaveLength(3);
    expect(res.operations!.map((o) => o.amount)).toEqual([3000, 2000, 1000]);
    expect(res.operations!.map((o) => o.kind)).toEqual([
      "EXPENSE",
      "EXPENSE",
      "EXPENSE",
    ]);
  });

  it("parses a mixed expense + income batch in a single call", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "Logged 1 expense and 2 incomes.",
      operations: [
        { kind: "EXPENSE", amount: 200, category: "Needs", subcategory: "Transport", note: "cab" },
        { kind: "INCOME", amount: 1000, source: "Salary", note: "salary" },
        { kind: "INCOME", amount: 100, source: "Gift", note: "gift" },
      ],
    });

    const res = await extractFinancialIntent(
      "spent 200 on cab and got salary 1000, gift 100",
      "u1",
    );

    expect(res.type).toBe("TRANSACTION_BATCH");
    expect(res.operations).toHaveLength(3);
    const kinds = res.operations!.map((o) => o.kind);
    expect(kinds).toContain("EXPENSE");
    expect(kinds.filter((k) => k === "INCOME")).toHaveLength(2);
  });

  it("leaves the date null when the user never stated one", async () => {
    // The extractor must not invent a date. Inventing one is what let a
    // dateless entry reach the ledger as "today"; the validation layer prompts
    // for the date instead, and null is the signal that it should.
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 500, subcategory: "Food" }],
    });

    const res = await extractFinancialIntent("spent 500 on food", "u1");

    expect(res.operations![0].date).toBeNull();
  });

  it("keeps a date the user actually stated", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 500, subcategory: "Food", date: "2023-08-15" }],
    });

    const res = await extractFinancialIntent(
      "spent 500 on food on 2023-08-15",
      "u1",
    );

    expect(res.operations![0].date).toBe("2023-08-15");
  });

  it("discards a malformed date rather than passing it through", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 500, subcategory: "Food", date: "15 Aug" }],
    });

    const res = await extractFinancialIntent("spent 500 on food", "u1");

    expect(res.operations![0].date).toBeNull();
  });
});

describe("extractFinancialIntent — output sanitisation", () => {
  it("drops operations with non-numeric or non-positive amounts", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "partial",
      operations: [
        { kind: "EXPENSE", amount: 500, subcategory: "Food" },
        { kind: "EXPENSE", amount: "not-a-number", subcategory: "Food" },
        { kind: "EXPENSE", amount: -200, subcategory: "Food" },
        { kind: "EXPENSE", amount: 0, subcategory: "Food" },
        { kind: "INCOME", amount: null },
      ],
    });

    const res = await extractFinancialIntent("spent 500 on food", "u1");

    expect(res.operations).toHaveLength(1);
    expect(res.operations![0].amount).toBe(500);
  });

  it("leaves an unrecognised expense category null so it gets asked", async () => {
    // Defaulting to "Needs" would file the expense in the wrong bucket without
    // the user ever being told. Null routes it to the category prompt.
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 100, category: "Bogus" }],
    });

    const res = await extractFinancialIntent("spent 100", "u1");
    expect(res.operations![0].category).toBeNull();
  });

  it("keeps a recognised expense category", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 100, category: "Wants" }],
    });

    const res = await extractFinancialIntent("spent 100", "u1");
    expect(res.operations![0].category).toBe("Wants");
  });

  it("leaves an unrecognised income source null instead of assuming Salary", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "INCOME", amount: 900, source: "Lottery" }],
    });

    const res = await extractFinancialIntent("got 900", "u1");
    expect(res.operations![0].source).toBeNull();
  });

  it("keeps a recognised income source", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "INCOME", amount: 900, source: "Gift" }],
    });

    const res = await extractFinancialIntent("got 900 as a gift", "u1");
    expect(res.operations![0].source).toBe("Gift");
  });

  it("leaves a missing subcategory null rather than defaulting to Other", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 300, category: "Needs" }],
    });

    const res = await extractFinancialIntent("spent 300", "u1");
    expect(res.operations![0].subcategory).toBeNull();
  });

  it("discards unknown operation kinds", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [
        { kind: "TRANSFER", amount: 100 },
        { kind: "EXPENSE", amount: 100, subcategory: "Food" },
      ],
    });

    const res = await extractFinancialIntent("move 100", "u1");

    expect(res.operations).toHaveLength(1);
    expect(res.operations![0].kind).toBe("EXPENSE");
  });

  it("demotes a batch whose operations are all invalid to UNKNOWN", async () => {
    groqReturns({
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: -5 }],
    });

    const res = await extractFinancialIntent("spent nothing", "u1");

    expect(res.type).toBe("UNKNOWN");
    expect(res.operations).toBeUndefined();
  });

  it("falls back to UNKNOWN for a non-object payload", async () => {
    mockCallGroqNLU.mockResolvedValue({
      content: "null",
      data: null,
      usage: { promptTokens: 1, outputTokens: 1 },
    });

    const res = await extractFinancialIntent("hmm", "u1");

    expect(res.type).toBe("UNKNOWN");
    expect(res.reply).toMatch(/could not understand/i);
  });
});

describe("extractFinancialIntent — queries and freeform", () => {
  it("returns a QUERY with queryKind and queryParam", async () => {
    groqReturns({
      type: "QUERY",
      reply: "Checking...",
      queryKind: "CATEGORY_BREAKDOWN",
      queryParam: "Food",
    });

    const res = await extractFinancialIntent("what did I spend on food?", "u1");

    expect(res.type).toBe("QUERY");
    expect(res.queryKind).toBe("CATEGORY_BREAKDOWN");
    expect(res.queryParam).toBe("Food");
  });

  it("returns FREEFORM for general advice questions", async () => {
    groqReturns({ type: "FREEFORM", reply: "The 50/30/20 rule allocates half to needs." });

    const res = await extractFinancialIntent("what is the 50/30/20 rule?", "u1");

    expect(res.type).toBe("FREEFORM");
    expect(res.operations).toBeUndefined();
  });
});

describe("extractFinancialIntent — resilience", () => {
  it("degrades to a friendly message when every engine is unreachable", async () => {
    mockCallGroqNLU.mockRejectedValue(new Error("groq down"));

    const res = await extractFinancialIntent("spent 100 on food", "u1");

    expect(res.type).toBe("UNKNOWN");
    expect(res.reply).toMatch(/temporarily unavailable/i);
    // Flagged so the route surfaces the status message instead of re-handling
    // the user's text through a legacy path.
    expect(res.degraded).toBe(true);
  });

  it("does not flag degradation when an engine answered normally", async () => {
    groqReturns({ type: "FREEFORM", reply: "Compounding means interest on interest." });

    const res = await extractFinancialIntent("explain compounding", "u1");

    expect(res.degraded).toBeUndefined();
  });

  it("recovers when Groq fails but Gemini succeeds", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    mockCallGroqNLU.mockRejectedValue(new Error("groq down"));

    const generateContent = vi.fn().mockResolvedValue({
      // `text` is a getter on the real response object, not a method.
      text: JSON.stringify({
        type: "TRANSACTION_BATCH",
        reply: "Logged via Gemini.",
        operations: [{ kind: "EXPENSE", amount: 750, subcategory: "Food" }],
      }),
    });

    const { GoogleGenAI } = await import("@google/genai");
    (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      function (this: any) {
        this.models = { generateContent };
      },
    );

    const res = await extractFinancialIntent("spent 750 on food", "u1");

    expect(res.type).toBe("TRANSACTION_BATCH");
    expect(res.operations![0].amount).toBe(750);
    delete process.env.GEMINI_API_KEY;
  });

  it("strips fenced code blocks from the model response", async () => {
    const payload = {
      type: "TRANSACTION_BATCH",
      reply: "ok",
      operations: [{ kind: "EXPENSE", amount: 42, subcategory: "Snacks" }],
    };
    mockCallGroqNLU.mockResolvedValue({
      content: "```json\n" + JSON.stringify(payload) + "\n```",
      data: "```json\n" + JSON.stringify(payload) + "\n```",
      usage: { promptTokens: 1, outputTokens: 1 },
    });

    const res = await extractFinancialIntent("spent 42 on snacks", "u1");

    expect(res.type).toBe("TRANSACTION_BATCH");
    expect(res.operations![0].amount).toBe(42);
  });

  it("logs token usage for the successful extraction", async () => {
    groqReturns({ type: "FREEFORM", reply: "hi" });

    await extractFinancialIntent("explain compounding", "u1");

    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", callType: "nlu", fallbackUsed: false }),
    );
  });
});

describe("operation typing", () => {
  it("exposes the three supported operation kinds", () => {
    const kinds: OperationKind[] = ["EXPENSE", "INCOME", "BUDGET_UPDATE"];
    expect(kinds).toEqual(["EXPENSE", "INCOME", "BUDGET_UPDATE"]);
  });

  it("exposes the six supported query kinds", () => {
    const queries: QueryKind[] = [
      "EXPENSE_SUMMARY",
      "INCOME_SUMMARY",
      "BUDGET_STATUS",
      "SAVINGS_INSIGHTS",
      "CATEGORY_BREAKDOWN",
      "COMPARISON",
    ];
    expect(queries).toHaveLength(6);
  });

  it("keeps ParsedOperation amount required and optional fields absent-safe", () => {
    const op: ParsedOperation = { kind: "EXPENSE", amount: 10 };
    expect(op.amount).toBe(10);
    expect(op.note).toBeUndefined();
    expect(op.date).toBeUndefined();
  });
});