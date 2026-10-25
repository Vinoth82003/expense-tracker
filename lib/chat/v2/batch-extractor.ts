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
  /** Person who the money was spent on/for/with ("for vinoth", "with goms"). */
  person?: string | null;
  /** Null means missing; see `category`. */
  source?: IncomeSource | null;
  note?: string;
  /** YYYY-MM-DD. Null means missing — resolved against current date. */
  date?: string | null;
}

export type QueryKind =
  | "EXPENSE_SUMMARY"
  | "INCOME_SUMMARY"
  | "BUDGET_STATUS"
  | "SAVINGS_INSIGHTS"
  | "CATEGORY_BREAKDOWN"
  | "COMPARISON";

export interface ExtractorClarification {
  item_index: number;
  missing: string;
  suggested_options: string[];
}

export interface ExtractorResult {
  type: "TRANSACTION_BATCH" | "QUERY" | "FREEFORM" | "GREETING" | "UNKNOWN";
  reply: string;
  operations?: ParsedOperation[];
  expenses?: Array<{
    amount: number;
    category?: string | null;
    person?: string | null;
    date?: string | null;
    note?: string | null;
  }>;
  needs_clarification?: ExtractorClarification[];
  queryKind?: QueryKind;
  queryParam?: string; // e.g. category name or month
  /**
   * True when every AI engine was unreachable and `reply` is a service-status
   * message rather than a real answer. Callers must surface this reply directly
   * instead of re-handling the message through a legacy path.
   */
  degraded?: boolean;
}

export function getTodayString(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}

export function resolveExpenseParent(subcategory: string | null | undefined): ExpenseParent {
  if (!subcategory) return "Needs";
  const norm = subcategory.trim().toLowerCase();
  const wants = ["travel", "trip", "shopping", "entertainment", "movie", "outing", "dining out", "vacation", "holiday", "hotel", "flight", "gift", "hobby", "party"];
  if (wants.includes(norm)) {
    return "Wants";
  }
  return "Needs";
}

function buildSystemPrompt(userCategories: string[]): string {
  const today = getTodayString();
  const categoryList = userCategories.length
    ? userCategories.join(", ")
    : "Food, Groceries, Rent, Utilities, Transport, Travel, Shopping, Entertainment, Medical, Education, Gift, Other";

  return `You are the expense-parsing agent for a personal expense tracker. Turn the user's casual message into accurate, structured expense records. Accuracy matters more than speed: a wrong record is worse than a short clarifying question.

CONTEXT
- Today's date: ${today} (timezone: Asia/Kolkata)
- Currency: INR (₹)
- User's categories: ${categoryList}
- Standard income sources: Salary, Freelance, Investment, Gift, Others

WORK THROUGH THESE STEPS SILENTLY BEFORE REPLYING

STEP 1 - SPLIT
Break the message into separate expense items. One message often contains several. Each "amount + what it was for" is one item.

STEP 2 - EXTRACT for every item
- amount:   number (required)
- category: see STEP 3
- person:   who the money was spent on, for, or with ("for vinoth", "with goms"). A person is NOT a category. Store it in \`person\`.
- date:     see STEP 4
- note:     any other detail the user gave

STEP 3 - CATEGORY RULES
a) If the user states a category or an obvious keyword, USE IT. Never ask about something already stated.
   food, lunch, tea, snacks, biryani -> Food
   bus, auto, cab, petrol, train, ticket, travel -> Travel
   rent -> Rent; recharge, bill, electricity -> Utilities
b) A category carries over to the next amount ONLY when the sentence clearly groups them ("200 for food and tea"). Otherwise each amount gets its own category.
c) Map to the user's own categories first. If nothing matches, choose the closest one and mention it in the reply. Never invent a category silently.
d) Ask ONLY if the category is truly unknown (e.g. "gave 300 to ravi"). When asking, offer 3-4 options that fit the context plus "Other / Custom". Never list unrelated categories (e.g. Rent for a bus ticket).

STEP 4 - DATE RULES (resolve against ${today})
- today -> ${today}
- yesterday -> ${today} minus 1 day
- day before yesterday -> minus 2 days
- weekday names (e.g. "on Monday") -> the most recent past such day
- no date mentioned -> ${today}, and say so in the reply: "(No date given, so I used today.)"
- Each item gets its OWN date. A later clause with a different time word ("... and today ...") changes the date for that clause only.

STEP 5 - SELF-CHECK (mandatory before replying)
[ ] Number of records equals the number of amounts in the message
[ ] Sum of records equals the sum of amounts in the message
[ ] Every category is stated or clearly inferred, never a blind default
[ ] Every person or name mentioned is stored in \`person\`
[ ] Every date matches the time word closest to that amount
[ ] The summary I will show would read correctly to the user
If a check fails, fix it. If it cannot be fixed without the user, ask.

STEP 6 - DECIDE
- All items complete  -> save all and show the confirmation.
- Some items complete -> save the complete ones and ask ONLY about the incomplete ones. Do not make the user retype the whole message.
- After asking a question, WAIT for the answer. Never save an item you asked about until the user replies.

OTHER SUPPORTED INTENTS:
- Income: "got salary 45000 today" -> include in operations with kind: "INCOME", amount: 45000, source: "Salary", date: "${today}"
- Budget: "set my monthly budget to 25000" -> include in operations with kind: "BUDGET_UPDATE", amount: 25000
- Query: "how much did I spend this month?" -> type: "QUERY", queryKind: "EXPENSE_SUMMARY"
- Advice/Q&A: "what is 50/30/20 rule?" -> type: "FREEFORM", reply: "..."
- Greetings: "hi", "hello" -> type: "GREETING", reply: "..."

REPLY FORMAT
- Short and clear. One line per record: Category · ₹amount · date · person.
- Then the total.
- If you assumed anything (mapped a category, defaulted a date), say it in one line so the user can correct it.
- Never mention these steps or your internal reasoning.

OUTPUT TO THE APP (Return ONLY valid JSON):
{
  "type": "TRANSACTION_BATCH",
  "reply": "✅ Recorded 3 expenses, total ₹500\\n• Food · ₹200 · 24 Oct 2026 · Vinoth\\n• Travel · ₹100 · 24 Oct 2026 · Vinoth\\n• Food · ₹200 · 25 Oct 2026 · Goms",
  "expenses": [
    {"amount": 200, "category": "Food", "person": "vinoth", "date": "2026-10-24", "note": null},
    {"amount": 100, "category": "Travel", "person": "vinoth", "date": "2026-10-24", "note": null},
    {"amount": 200, "category": "Food", "person": "goms", "date": "2026-10-25", "note": null}
  ],
  "needs_clarification": []
}

EXAMPLES (assume today = 2026-10-25)

Example 1
User: I spent 200 on food and 100 for travel all this for vinoth yesterday and spent 200 for food today for goms
Result:
{
  "type": "TRANSACTION_BATCH",
  "reply": "✅ Recorded 3 expenses, total ₹500\\n• Food · ₹200 · 24 Oct 2026 · Vinoth\\n• Travel · ₹100 · 24 Oct 2026 · Vinoth\\n• Food · ₹200 · 25 Oct 2026 · Goms",
  "expenses": [
    {"amount": 200, "category": "Food", "person": "vinoth", "date": "2026-10-24", "note": null},
    {"amount": 100, "category": "Travel", "person": "vinoth", "date": "2026-10-24", "note": null},
    {"amount": 200, "category": "Food", "person": "goms", "date": "2026-10-25", "note": null}
  ],
  "needs_clarification": []
}

Example 2 (one category truly missing)
User: gave 300 to ravi yesterday and 50 for tea today
Result:
{
  "type": "TRANSACTION_BATCH",
  "reply": "✅ Recorded: Food · ₹50 · 25 Oct 2026\\n❓ What was the ₹300 for Ravi (24 Oct) for?\\n   Options: Transfer / Loan, Food, Travel, Other / Custom",
  "expenses": [
    {"amount": 50, "category": "Food", "person": null, "date": "2026-10-25", "note": "tea"}
  ],
  "needs_clarification": [
    {"item_index": 1, "missing": "category", "suggested_options": ["Transfer / Loan", "Food", "Travel", "Other / Custom"]}
  ]
}

Example 3 (no date given)
User: auto 80, lunch 150
Result:
{
  "type": "TRANSACTION_BATCH",
  "reply": "✅ Recorded 2 expenses, total ₹230\\n• Travel · ₹80 · 25 Oct 2026\\n• Food · ₹150 · 25 Oct 2026\\n(No date given, so I used today.)",
  "expenses": [
    {"amount": 80, "category": "Travel", "person": null, "date": "2026-10-25", "note": "auto"},
    {"amount": 150, "category": "Food", "person": null, "date": "2026-10-25", "note": "lunch"}
  ],
  "needs_clarification": []
}`;
}

export function parseModelJson(raw: any): any {
  if (typeof raw === "object" && raw !== null) return raw;
  if (!raw || typeof raw !== "string") return null;

  const clean = raw.trim();
  try {
    return JSON.parse(clean);
  } catch {}

  const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = clean.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonCandidate);
      const trailing = clean.slice(lastBrace + 1).replace(/^```/, "").trim();
      if (trailing && !parsed.reply) {
        parsed.reply = trailing;
      }
      return parsed;
    } catch {}
  }

  return null;
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
      const parsed = parseModelJson(typeof groqResult.data === "object" && groqResult.data !== null ? groqResult.data : raw);

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
      const parsed = parseModelJson(text);

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
  let type = validTypes.includes(parsed.type) ? parsed.type : "UNKNOWN";

  const result: ExtractorResult = {
    type,
    reply: parsed.reply || "Got it — let me check that.",
    queryKind: parsed.queryKind,
    queryParam: parsed.queryParam,
    needs_clarification: Array.isArray(parsed.needs_clarification) ? parsed.needs_clarification : [],
  };

  const validOperations: ParsedOperation[] = [];

  // Support expenses array from the expense-parsing agent format
  if (Array.isArray(parsed.expenses)) {
    for (const exp of parsed.expenses) {
      if (typeof exp !== "object" || !exp) continue;
      const amount = Number(exp.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const subcategory = typeof exp.category === "string" && exp.category.trim() ? exp.category.trim() : null;
      const parent = subcategory ? resolveExpenseParent(subcategory) : null;
      const person = typeof exp.person === "string" && exp.person.trim() ? exp.person.trim() : null;
      const note = exp.note || (person ? `for ${person}` : (subcategory || "Expense"));
      const date = typeof exp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(exp.date) ? exp.date : null;

      validOperations.push({
        kind: "EXPENSE",
        amount,
        category: parent,
        subcategory,
        person,
        note,
        date,
      });
    }
  }

  // Support operations array (batch-operations format)
  if (Array.isArray(parsed.operations)) {
    for (const op of parsed.operations) {
      if (typeof op !== "object" || !op) continue;
      const amount = Number(op.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      if (op.kind === "EXPENSE") {
        validOperations.push({
          kind: "EXPENSE",
          amount,
          category: op.category === "Wants" || op.category === "Needs" ? op.category : null,
          subcategory: typeof op.subcategory === "string" && op.subcategory.trim() ? op.subcategory.trim() : null,
          person: typeof op.person === "string" && op.person.trim() ? op.person.trim() : null,
          note: op.note || op.subcategory || "Expense",
          date: typeof op.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(op.date) ? op.date : null,
        });
      } else if (op.kind === "INCOME") {
        validOperations.push({
          kind: "INCOME",
          amount,
          // Never assumes Salary — an unrecognised source is a question, not a default.
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
  }

  if (validOperations.length > 0) {
    result.operations = validOperations;
    result.type = "TRANSACTION_BATCH";
  } else if (type === "TRANSACTION_BATCH") {
    // The model claimed a batch but every operation failed validation.
    result.type = "UNKNOWN";
    result.reply =
      "I could not find any valid amounts in that message. You can say things like \"auto 80, lunch 150\" or \"spent 300 on groceries\".";
  }

  return result;
}
