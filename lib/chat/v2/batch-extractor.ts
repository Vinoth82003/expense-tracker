import { callGroqNLU, isGroqChatEnabled, GroqRole } from "@/lib/chat/groq";
import { logAiUsage } from "@/lib/chat/ai/usage";
import { sanitizePii } from "@/lib/pii";
import { GoogleGenAI } from "@google/genai";

export type OperationKind = "EXPENSE" | "INCOME" | "BUDGET_UPDATE";

export type ExpenseParent = "Needs" | "Wants";

export type IncomeSource = "Salary" | "Freelance" | "Investment" | "Gift" | "Others";

export const INCOME_SOURCES: IncomeSource[] = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Others",
];

export interface ParsedOperation {
  kind: OperationKind;
  amount: number;
  /**
   * Null means "the user never told me" — not a default. The validation layer
   * treats null as a missing field and prompts for it, so it must never be
   * pre-filled here.
   */
  category?: ExpenseParent | null;
  /** Null means missing; see `category`. */
  subcategory?: string | null;
  /** Null means missing; see `category`. */
  source?: IncomeSource | null;
  note?: string;
  /** YYYY-MM-DD. Null means missing — never defaulted to today here. */
  date?: string | null;
}

export type QueryKind =
  | "EXPENSE_SUMMARY"
  | "INCOME_SUMMARY"
  | "BUDGET_STATUS"
  | "SAVINGS_INSIGHTS"
  | "CATEGORY_BREAKDOWN"
  | "COMPARISON";

export interface ExtractorResult {
  type: "TRANSACTION_BATCH" | "QUERY" | "FREEFORM" | "GREETING" | "UNKNOWN";
  reply: string;
  operations?: ParsedOperation[];
  queryKind?: QueryKind;
  queryParam?: string; // e.g. category name or month
  /**
   * True when every AI engine was unreachable and `reply` is a service-status
   * message rather than a real answer. Callers must surface this reply directly
   * instead of re-handling the message through a legacy path.
   */
  degraded?: boolean;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildSystemPrompt(userCategories: string[]): string {
  const today = getTodayString();
  const categoryList = userCategories.length ? userCategories.join(", ") : "Food, Groceries, Rent, Utilities, Transport, Shopping, Entertainment, Medical, Travel, Education, Gift, Other";

  return `You are Sage, the production-grade AI financial assistant for SpendWise.
Today's date is: ${today}. Use it only to resolve relative dates the user actually said ("yesterday", "last friday").
The user's available expense categories: ${categoryList}.
Standard income sources: Salary, Freelance, Investment, Gift, Others.

CRITICAL RULE — never invent information:
Only fill a field when the user ACTUALLY said it. If they did not mention a date, a
category, or an income source, set that field to null. A null field means "I need to
ask the user", not "make a sensible guess". Inventing a date is the single worst mistake
you can make — do not substitute today's date for a date the user never gave.

Your task is to parse the user's message and determine their intent:

1. "TRANSACTION_BATCH": When user mentions ANY transaction(s) to add or log.
   - Support MULTIPLE transactions in a single input!
   - Examples:
     * "spent 394 on grocery" -> 1 EXPENSE: amount 394, category "Needs", subcategory "Groceries", note "Grocery", date null
     * "3000 on grocery, 2000 on rent, 1000 on food" -> 3 EXPENSES, all with date null
     * "spent 500 on groceries on 2023-08-15" -> 1 EXPENSE with date "2023-08-15"
     * "spent 200 on cab and got salary 1000, gift 100" -> 1 EXPENSE (200 Transport) + 2 INCOMES (1000 Salary, 100 Gift)
     * "got salary 45000 today" -> 1 INCOME: amount 45000, source "Salary", date "<today>"
     * "spent 500 on groceries, 200 on transport, and 300 on" -> 2 EXPENSES with a
       category, plus 1 EXPENSE (amount 300) with category null AND subcategory null
       AND date null, because "300 on" names neither a category nor a date
     * "set my monthly budget to 25000" -> 1 BUDGET_UPDATE: amount 25000

2. "QUERY": When user asks to view, check, or summarize existing data.
   - "how much did I spend this month?" -> queryKind: "EXPENSE_SUMMARY"
   - "show my income this month" -> queryKind: "INCOME_SUMMARY"
   - "how is my budget?" -> queryKind: "BUDGET_STATUS"
   - "give me financial insights" -> queryKind: "SAVINGS_INSIGHTS"
   - "what did I spend on food?" -> queryKind: "CATEGORY_BREAKDOWN", queryParam: "Food"
   - "compare this month vs last month" -> queryKind: "COMPARISON"

3. "FREEFORM": General financial advice, questions (e.g., "what is 50/30/20 rule?", "how to save for emergency fund?").

4. "GREETING": Greetings like "hi", "hello", "hey Sage".

OUTPUT FORMAT: Return ONLY valid, minified JSON. Do not include markdown formatting or backticks.
Write "reply" as a short, warm confirmation of what you understood — the app appends its
own detail and follow-up prompts, so keep it to one sentence.
Schema:
{
  "type": "TRANSACTION_BATCH" | "QUERY" | "FREEFORM" | "GREETING" | "UNKNOWN",
  "reply": "Polite, helpful message confirming the action or answering the query",
  "operations": [
    {
      "kind": "EXPENSE",
      "amount": 394,
      "category": "Needs",
      "subcategory": "Groceries",
      "note": "grocery",
      "date": null
    }
  ],
  "queryKind": "EXPENSE_SUMMARY"
}

Field rules:
- "date": the date the user stated, as YYYY-MM-DD, or null if they stated none.
  Resolve relative words against today's date above. Never default it to today.
- "category" (EXPENSE): "Needs" or "Wants", or null when the user gave no category.
- "subcategory" (EXPENSE): the specific label they gave, or null when unknown.
  Pick from the available categories list above when one clearly fits.
- "source" (INCOME): Salary, Freelance, Investment, Gift, Others, or null when the
  user did not say where it came from. Never assume Salary.
- "amount": must be a positive number. Drop any operation you cannot put an amount on.

Self-check before answering: for every operation, is each field either something the
user said, or null? If any value is a guess, replace it with null.`;
}

export async function extractFinancialIntent(
  message: string,
  userId: string,
  userCategories: string[] = [],
  conversation: Array<{ role?: string; content?: string }> = []
): Promise<ExtractorResult> {
  const sanitizedMessage = sanitizePii(message).trim();
  if (!sanitizedMessage) {
    return { type: "UNKNOWN", reply: "Please enter a message." };
  }

  // Quick check for simple greetings
  const lower = sanitizedMessage.toLowerCase();
  if (/^(hi|hello|hey|greetings|good morning|good evening|good afternoon)(\s+sage)?[\s!.]*$/i.test(lower)) {
    return {
      type: "GREETING",
      reply: "Hi there! I'm Sage, your personal financial assistant. I can help you log single or multiple expenses and income, check your budget, or offer savings advice. What would you like to do?",
    };
  }

  const systemPrompt = buildSystemPrompt(userCategories);
  const start = Date.now();

  // 1. Primary Engine: Groq (openai/gpt-oss-120b)
  if (isGroqChatEnabled() && process.env.GROQ_API_KEY) {
    try {
      const messages: Array<{ role: GroqRole; content: string }> = [
        { role: "system", content: systemPrompt },
      ];

      // Add recent context
      if (conversation.length) {
        conversation.slice(-4).forEach((turn) => {
          if (turn.content) {
            messages.push({
              role: turn.role === "assistant" ? "assistant" : "user",
              content: sanitizePii(turn.content),
            });
          }
        });
      }

      messages.push({ role: "user", content: sanitizedMessage });

      const groqResult = await callGroqNLU(messages, {
        kind: "nlu",
        temperature: 0.1,
        jsonMode: true,
        timeoutMs: 8000,
      });

      const raw = groqResult.content || (typeof groqResult.data === "string" ? groqResult.data : JSON.stringify(groqResult.data));
      const parsed = typeof groqResult.data === "object" && groqResult.data !== null
        ? groqResult.data
        : JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());

      logAiUsage({
        userId,
        callType: "nlu",
        intent: (parsed && typeof parsed === "object" ? parsed.type : null) || "extracted",
        promptTokens: groqResult.usage.promptTokens,
        outputTokens: groqResult.usage.outputTokens,
        latencyMs: Date.now() - start,
        fallbackUsed: false,
      });

      return sanitizeExtractorOutput(parsed);
    } catch (groqErr) {
      console.warn("Groq NLU extraction failed, falling back to Gemini:", groqErr);
    }
  }

  // 2. Secondary Engine: Google Gemini (gemini-2.5-flash)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Message: ${sanitizedMessage}` }] },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      // `text` is a getter on GenerateContentResponse, not a method call.
      const text = (response as { text?: string }).text || "{}";
      const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());

      logAiUsage({
        userId,
        callType: "nlu",
        intent: (parsed && typeof parsed === "object" ? parsed.type : null) || "gemini_extracted",
        latencyMs: Date.now() - start,
        fallbackUsed: true,
      });

      return sanitizeExtractorOutput(parsed);
    } catch (geminiErr) {
      console.error("Gemini extraction fallback also failed:", geminiErr);
    }
  }

  // 3. Fallback when AI services are completely unreachable
  return {
    type: "UNKNOWN",
    reply: "Sage AI is temporarily unavailable. We are upgrading Sage AI for better performance and will be back soon.",
    degraded: true,
  };
}

function sanitizeExtractorOutput(parsed: any): ExtractorResult {
  if (!parsed || typeof parsed !== "object") {
    return {
      type: "UNKNOWN",
      reply:
        "I could not understand that one. Try something like \"spent 500 on groceries on 2026-03-15\", \"got salary 45000\", or \"set my monthly budget to 25000\".",
    };
  }

  const validTypes = ["TRANSACTION_BATCH", "QUERY", "FREEFORM", "GREETING", "UNKNOWN"];
  const type = validTypes.includes(parsed.type) ? parsed.type : "UNKNOWN";

  const result: ExtractorResult = {
    type,
    reply: parsed.reply || "Got it — let me check that.",
    queryKind: parsed.queryKind,
    queryParam: parsed.queryParam,
  };

  if (Array.isArray(parsed.operations)) {
    const validOperations: ParsedOperation[] = [];
    for (const op of parsed.operations) {
      if (typeof op !== "object" || !op) continue;
      const amount = Number(op.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      if (op.kind === "EXPENSE") {
        validOperations.push({
          kind: "EXPENSE",
          amount,
          // An unrecognised parent becomes null (missing) rather than "Needs":
          // defaulting it would file the expense in the wrong bucket without
          // the user ever being asked.
          category: op.category === "Wants" || op.category === "Needs" ? op.category : null,
          subcategory: typeof op.subcategory === "string" && op.subcategory.trim() ? op.subcategory.trim() : null,
          note: op.note || op.subcategory || "Expense",
          date: typeof op.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(op.date) ? op.date : null,
        });
      } else if (op.kind === "INCOME") {
        validOperations.push({
          kind: "INCOME",
          amount,
          // Never assumes Salary — an unrecognised source is a question, not a
          // default.
          source: INCOME_SOURCES.includes(op.source) ? op.source : null,
          note: op.note || op.source || "Income",
          date: typeof op.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(op.date) ? op.date : null,
        });
      } else if (op.kind === "BUDGET_UPDATE") {
        validOperations.push({
          kind: "BUDGET_UPDATE",
          amount,
          note: op.note || "Monthly budget",
          date: typeof op.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(op.date) ? op.date : null,
        });
      }
    }

    if (validOperations.length > 0) {
      result.operations = validOperations;
      result.type = "TRANSACTION_BATCH";
    } else if (type === "TRANSACTION_BATCH") {
      // The model claimed a batch but every operation failed validation (bad or
      // non-positive amount, unknown kind). Reporting TRANSACTION_BATCH with no
      // operations would hand callers a batch they cannot execute, so demote to
      // UNKNOWN and let the caller fall back to its own handling.
      result.type = "UNKNOWN";
      result.reply =
        "I could not find any valid amounts in that message. You can say things like \"spent 300 on groceries\" or \"got salary 50000\".";
    }
  }

  return result;
}
