import { describe, it, expect } from "vitest";
import { scoreAndDecide } from "@/lib/chat/v1/confidence";

describe("Confidence Scorer & Decision Engine Tests", () => {
  it("routes high confidence messages with complete entities to execute", () => {
    const res = scoreAndDecide("add_expense", 0.85, { amount: 500, category: "Groceries" }, "Add expense of ₹500 for groceries today");
    expect(res.action).toBe("execute");
    expect(res.intent).toBe("add_expense");
  });

  it("routes high confidence messages with missing required entities to ask_missing", () => {
    const res = scoreAndDecide("add_expense", 0.9, {}, "Add an expense");
    expect(res.action).toBe("ask_missing");
    expect(res.missingEntities).toContain("amount");
  });

  it("routes medium confidence messages to execute_with_suffix", () => {
    const res = scoreAndDecide("expense_summary", 0.6, {}, "How much money?");
    expect(res.action).toBe("execute_with_suffix");
    expect(res.intent).toBe("expense_summary");
  });

  it("routes low confidence messages to clarify with options", () => {
    const res = scoreAndDecide("expense_summary", 0.45, {}, "show me food");
    expect(res.action).toBe("clarify");
    expect(res.clarificationOptions).toBeDefined();
    expect(res.clarificationOptions?.length).toBeGreaterThan(0);
  });

  it("routes very low confidence messages to fallback", () => {
    const res = scoreAndDecide("unknown", 0.2, {}, "hello what's up how's it going");
    expect(res.action).toBe("fallback");
  });

  it("handles greeting intent correctly with high/low confidence friendly greeting", () => {
    const res = scoreAndDecide("greeting", 0.85, {}, "hello");
    expect(res.action).toBe("friendly_greeting");
  });

  it("detects ambiguity when top two intents are very close in score", () => {
    const otherScores = [
      { intent: "expense_summary", confidence: 0.65 },
      { intent: "budget_status", confidence: 0.62 }
    ];
    const res = scoreAndDecide("expense_summary", 0.65, {}, "how much budget summary", otherScores);
    expect(res.action).toBe("clarify");
    expect(res.intent).toBe("ambiguous");
    expect(res.clarificationOptions).toContain("See your spending summary");
    expect(res.clarificationOptions).toContain("Check your budget status");
  });
});
