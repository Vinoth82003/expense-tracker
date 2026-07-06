import { describe, it, expect, vi, beforeEach } from "vitest";
import { preprocessMessage } from "@/lib/chat/v1/preprocessor";
import { classifyIntent } from "@/lib/chat/v1/nlu-engine";
import { extractEntities } from "@/lib/chat/v1/entity-extractor";
import { scoreAndDecide } from "@/lib/chat/v1/confidence";
import { handleExpenseSummary } from "@/lib/chat/v1/handlers/expense-handler";
import { handleIncomeSummary } from "@/lib/chat/v1/handlers/income-handler";
import { handleBudgetStatus } from "@/lib/chat/v1/handlers/budget-handler";
import { handleAnalysis } from "@/lib/chat/v1/handlers/analysis-handler";
import { handleInsights } from "@/lib/chat/v1/handlers/insights-handler";
import { handleWrite } from "@/lib/chat/v1/handlers/write-handler";
import { handleOutOfScope } from "@/lib/chat/v1/handlers/scope-handler";
import { handleGreeting } from "@/lib/chat/v1/handlers/greeting-handler";

async function processMessage(message: string): Promise<{ intent: string; confidence: number; reply: string }> {
  const processed = preprocessMessage(message);
  const classification = classifyIntent(processed);
  const entities = extractEntities(processed);
  const decision = scoreAndDecide(classification.intent, classification.confidence, entities, processed);

  let reply = "";
  if (decision.action === "fallback" || decision.intent === "unknown") {
    reply = handleGreeting("unknown");
  } else if (decision.action === "friendly_greeting") {
    reply = handleGreeting("greeting");
  } else if (decision.action === "clarify") {
    const optionsStr = decision.clarificationOptions?.map(o => `• ${o}`).join("\n") || "";
    reply = `${decision.clarificationMessage}\n${optionsStr}`;
  } else if (decision.intent === "out_of_scope") {
    reply = handleOutOfScope(processed);
  } else {
    switch (decision.intent) {
      case "expense_summary":
        reply = await handleExpenseSummary(entities);
        break;
      case "income_summary":
        reply = await handleIncomeSummary(entities);
        break;
      case "budget_status":
        reply = await handleBudgetStatus(entities);
        break;
      case "add_expense":
      case "add_income":
      case "update_budget":
      case "delete_expense":
        const writeRes = await handleWrite(decision.intent, entities, processed);
        reply = writeRes.reply;
        break;
      case "spending_analysis":
      case "trend_analysis":
      case "comparison":
        reply = await handleAnalysis(decision.intent, entities, processed);
        break;
      case "financial_insights":
      case "combined_query":
        reply = await handleInsights(decision.intent, entities, processed);
        break;
      default:
        reply = handleGreeting("unknown");
        break;
    }
  }

  return {
    intent: decision.intent,
    confidence: decision.confidence,
    reply,
  };
}

describe("Chatbot v1 — CHATBOT_QUESTIONS.md E2E Tests", () => {
  beforeEach(() => {
    // Setup generic global fetch mock
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes("/api/expenses")) {
        if (init?.method === "POST" || init?.method === "DELETE" || init?.method === "PATCH") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: "Success" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            expenses: [
              { id: "1", amount: 250, category: "Wants", subcategory: "Groceries", note: "Weekly grocery shop", date: "2026-07-06" },
              { id: "2", amount: 150, category: "Wants", subcategory: "Food", note: "Lunch", date: "2026-07-06" },
              { id: "3", amount: 800, category: "Needs", subcategory: "Utilities", note: "Electricity bill", date: "2026-07-01" },
            ]
          }),
        });
      }
      if (lowerUrl.includes("/api/income")) {
        if (init?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: "Success" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            income: [
              { id: "1", amount: 45000, source: "Salary", note: "Main job", date: "2026-07-01" },
            ]
          }),
        });
      }
      if (lowerUrl.includes("/api/budget")) {
        if (init?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: "Success" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ limit: 20000, budget: { limit: 20000 } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    global.fetch = fetchMock;
  });

  // §1 Spending Summary
  describe("§1 Spending Summary", () => {
    const questions = [
      "What's my spending this month?",
      "How much have I spent this week?",
      "Show my spending for last month.",
      "What's my total spending this year?",
      "How much did I spend yesterday?",
      "Show all expenses from this month.",
      "How much have I spent so far?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §2 Category Spending
  describe("§2 Category Spending", () => {
    const questions = [
      "How much did I spend on groceries this month?",
      "Show my food expenses.",
      "What's my transportation spending this month?",
      "How much have I spent on shopping?",
      "Show entertainment expenses.",
      "Which category has the highest spending?",
      "Which category has the lowest spending?",
      "Compare grocery spending with dining.",
      "How much did I spend on bills last month?",
      "Show expenses by category.",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §3 Spending Analysis
  describe("§3 Spending Analysis", () => {
    const questions = [
      "Where am I spending the most money?",
      "What are my biggest expenses?",
      "What is my average daily spending?",
      "How much do I spend on weekends?",
      "Has my spending increased this month?",
      "Compare this month's spending with last month.",
      "Which category increased the most?",
      "Which category decreased the most?",
      "Show my spending trends.",
      "Am I spending more than usual?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §4 Expense Management
  describe("§4 Expense Management", () => {
    const questions = [
      "Add an expense of ₹250 for lunch today.",
      "Record ₹1,200 for groceries.",
      "Add a fuel expense of ₹800.",
      "I spent ₹650 on shopping yesterday.",
      "Record ₹1,500 for electricity bill.",
      "Add movie tickets for ₹500.",
      "Add coffee expense ₹180.",
      "Record dinner expense ₹900 today.",
      "Add medical expense of ₹2,000.",
      "I paid ₹750 for internet.",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(["add_expense", "expense_summary"]).toContain(res.intent);
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §5 Expense Editing
  describe("§5 Expense Editing", () => {
    const questions = [
      "Update my grocery expense to ₹900.",
      "Change yesterday's dinner expense to ₹650.",
      "Edit my fuel expense.",
      "Correct the amount for today's lunch.",
      "Change the category of my expense.",
      "Delete today's coffee expense.",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §6 Income Management
  describe("§6 Income Management", () => {
    const questions = [
      "Record salary income of ₹45,000.",
      "Add freelance income of ₹15,000.",
      "Record bonus income.",
      "Add rental income.",
      "Show my income this month.",
      "How much income did I receive last month?",
      "Show income history.",
      "What's my total income this year?",
      "Record ₹5,000 as cash received.",
      "Add business income.",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §7 Budget Management
  describe("§7 Budget Management", () => {
    const questions = [
      "Set my monthly budget to ₹20,000.",
      "Update my grocery budget to ₹5,000.",
      "Create a dining budget.",
      "Increase my shopping budget.",
      "Show my budget.",
      "What's my remaining budget?",
      "Have I exceeded my budget?",
      "How much budget is left?",
      "Show budget utilization.",
      "Which budget category is almost full?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §8 Budget Insights
  describe("§8 Budget Insights", () => {
    const questions = [
      "How much of my budget have I used?",
      "Which category exceeded the budget?",
      "Which categories are under budget?",
      "Am I within my monthly budget?",
      "Show budget progress.",
      "Compare budget vs actual spending.",
      "How much can I still spend?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §9 Date-Based Questions
  describe("§9 Date-Based Questions", () => {
    const questions = [
      "What did I spend today?",
      "Show yesterday's expenses.",
      "What did I spend last week?",
      "Show expenses from June.",
      "What did I spend in January?",
      "Show expenses between June 1 and June 15.",
      "What did I spend over the weekend?",
      "Show expenses from the last 30 days.",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §10 Trend Questions
  describe("§10 Trend Questions", () => {
    const questions = [
      "How has my spending changed?",
      "Show my monthly spending trend.",
      "Is my grocery spending increasing?",
      "Which category is growing the fastest?",
      "Compare spending over the last six months.",
      "What's my average monthly spending?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §11 Comparison Questions
  describe("§11 Comparison Questions", () => {
    const questions = [
      "Compare this month with last month.",
      "Compare grocery spending for June and July.",
      "Did I spend more on dining or shopping?",
      "Compare income and expenses.",
      "Which month had the highest spending?",
      "Which month had the lowest spending?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §12 Financial Insights
  describe("§12 Financial Insights", () => {
    const questions = [
      "Where can I save money?",
      "Which expenses are unusually high?",
      "What are my top spending categories?",
      "What is my biggest recurring expense?",
      "Summarize my finances.",
      "Give me an overview of this month's finances.",
      "What are my spending habits?",
      "Show financial insights.",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §13 Combined Questions
  describe("§13 Combined Questions", () => {
    const questions = [
      "What's my spending this month and remaining budget?",
      "How much have I spent on groceries and dining?",
      "Show my income and expenses this month.",
      "Compare income with expenses.",
      "What's my balance after expenses?",
      "Which category is closest to its budget?",
    ];

    questions.forEach((q) => {
      it(`should handle: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBeTruthy();
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §14 Natural Language Requests
  describe("§14 Natural Language Requests", () => {
    const tests = [
      { input: "I had lunch for ₹350 today.", expectedIntents: ["add_expense"] },
      { input: "Bought groceries worth ₹1,200.", expectedIntents: ["add_expense"] },
      { input: "Salary credited today ₹55,000.", expectedIntents: ["add_income"] },
      { input: "Spent ₹800 on petrol.", expectedIntents: ["add_expense"] },
      { input: "Paid electricity bill ₹1,600.", expectedIntents: ["add_expense"] },
      { input: "Set my food budget to ₹6,000.", expectedIntents: ["update_budget"] },
      { input: "Show where my money went this month.", expectedIntents: ["expense_summary"] },
      { input: "Am I overspending?", expectedIntents: ["budget_status"] },
      { input: "How much money do I have left to spend?", expectedIntents: ["budget_status", "expense_summary"] },
      { input: "Give me a summary of my finances.", expectedIntents: ["financial_insights", "expense_summary"] },
    ];

    tests.forEach(({ input, expectedIntents }) => {
      it(`should map: "${input}"`, async () => {
        const res = await processMessage(input);
        expect(expectedIntents).toContain(res.intent);
        expect(res.reply).toBeTruthy();
      });
    });
  });

  // §15 Questions Sage AI Should Not Support
  describe("§15 Out-of-Scope Rejection", () => {
    const questions = [
      "Transfer ₹5,000 to my friend.",
      "Pay my electricity bill.",
      "Invest ₹10,000 in stocks.",
      "Check my bank account balance.",
      "Show my credit card transactions.",
      "Open a new bank account.",
      "Apply for a loan.",
      "Send money through UPI.",
      "Buy cryptocurrency.",
      "Access my bank statements.",
    ];

    questions.forEach((q) => {
      it(`should reject out-of-scope: "${q}"`, async () => {
        const res = await processMessage(q);
        expect(res.intent).toBe("out_of_scope");
        expect(res.reply).toMatch(/(not able to help|cannot assist)/i);
      });
    });
  });
});
