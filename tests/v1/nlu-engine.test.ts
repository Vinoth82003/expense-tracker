import { describe, it, expect } from "vitest";
import { preprocessMessage } from "@/lib/chat/v1/preprocessor";
import { classifyIntent } from "@/lib/chat/v1/nlu-engine";
import { extractEntities } from "@/lib/chat/v1/entity-extractor";

describe("Preprocessor Tests", () => {
  it("converts strings to lowercase and trims spaces", () => {
    expect(preprocessMessage("  Add ₹250 for Lunch  ")).toBe("add ₹250 for lunch");
  });

  it("normalizes diverse currency keywords to ₹ symbol", () => {
    expect(preprocessMessage("Spent Rs. 1,200 on groceries")).toBe("spent ₹1200 on groceries");
    expect(preprocessMessage("Salary received INR 20000")).toBe("salary received ₹20000");
  });

  it("transforms common English word numbers", () => {
    expect(preprocessMessage("Add five thousand rupees")).toBe("add 5 1000 ₹");
  });
});

describe("NLU Intent Classifier Tests", () => {
  it("properly classifies expense summaries", () => {
    const result = classifyIntent("what is my spending this month?");
    expect(result.intent).toBe("expense_summary");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("detects budget queries", () => {
    const result = classifyIntent("how much budget is left?");
    expect(result.intent).toBe("budget_status");
  });

  it("handles out of scope triggers", () => {
    const result = classifyIntent("can you transfer ₹5,000 to my friend?");
    expect(result.intent).toBe("out_of_scope");
  });
});

describe("Entity Extractor Tests", () => {
  it("extracts amounts and notes accurately", () => {
    const res = extractEntities("Add ₹250 for taxi today");
    expect(res.amount).toBe(250);
    expect(res.note).toBe("taxi");
    expect(res.dateStr).toBe("today");
  });

  it("maps synonyms to standard Categories", () => {
    const res = extractEntities("I spent ₹800 on petrol yesterday");
    expect(res.amount).toBe(800);
    expect(res.category).toBe("Transport");
  });
});
