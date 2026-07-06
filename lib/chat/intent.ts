import { endOfDay, endOfMonth, endOfWeek, parse, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";

export type ChatIntentType =
  | "expense_summary"
  | "income_summary"
  | "budget_status"
  | "add_expense"
  | "add_income"
  | "update_budget"
  | "unknown";

export type ExpenseDetails = {
  amount?: number;
  category?: string;
  date?: Date;
  note?: string;
  // If the chat flow includes an explicit request to create a category
  createCategory?: boolean;
  // Optional user-provided category name during confirmation flows
  confirmCategoryName?: string;
  // Original user message — used as fallback context for category matching
  originalMessage?: string;
};

export type BudgetDetails = {
  amount?: number;
  period?: string;
};

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export type ChatIntent = {
  type: ChatIntentType;
  timeframe?: DateRange;
  details?: ExpenseDetails | BudgetDetails;
};

// ─── Date parsing ─────────────────────────────────────────────────────────────

function parseDateFromPhrase(text: string): Date | undefined {
  const normalized = text.toLowerCase();
  const today = new Date();

  if (normalized.includes("today")) return startOfDay(today);
  if (normalized.includes("yesterday")) return startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
  if (normalized.includes("this week")) return startOfWeek(today, { weekStartsOn: 1 });
  if (normalized.includes("last week")) return startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  if (normalized.includes("this month")) return startOfMonth(today);
  if (normalized.includes("last month")) return startOfMonth(subMonths(today, 1));

  const match = normalized.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
  if (!match) return undefined;

  const rawDate = match[1];
  const parsed = parse(rawDate, rawDate.split("/").length === 3 ? "dd/MM/yyyy" : "dd/MM", new Date());
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return undefined;
}

function buildDateRange(message: string): DateRange {
  const now = new Date();
  const normalized = message.toLowerCase();

  if (normalized.includes("last month") || normalized.includes("previous month")) {
    return {
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
      label: "last month",
    };
  }
  if (normalized.includes("this month")) {
    return { start: startOfMonth(now), end: endOfMonth(now), label: "this month" };
  }
  if (normalized.includes("last week")) {
    const rangeStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    return { start: rangeStart, end: endOfWeek(rangeStart, { weekStartsOn: 1 }), label: "last week" };
  }
  if (normalized.includes("this week")) {
    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }), label: "this week" };
  }
  if (normalized.includes("today")) {
    return { start: startOfDay(now), end: endOfDay(now), label: "today" };
  }

  return { start: subWeeks(now, 4), end: endOfDay(now), label: "the last 30 days" };
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

const amountRegex = /(?:₹|rs\.?|inr)?\s*([0-9]+(?:[.,][0-9]+)?)/i;

function parseAmount(text: string): number | undefined {
  const match = text.match(amountRegex);
  if (!match) return undefined;
  const parsed = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

// ─── Note parsing ─────────────────────────────────────────────────────────────

/**
 * Extracts a clean note/item name from the user's message.
 *
 * Patterns handled:
 *   "Add expense of 250 for taxi today"   → note = "taxi"
 *   "Bought shoes for 500 at Nike"        → note = "shoes"
 *   "Spent 300 on groceries yesterday"    → note = "groceries"
 *   "Add expense of 100 for badminton"    → note = "badminton"
 */
function parseNote(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Strip currency + amount prefix to avoid including numbers in note
  // e.g. "of 250 for taxi" → extract "taxi"
  let note: string | undefined;

  // Pattern: "bought <item> for|at"
  const boughtMatch = text.match(/\bbought\s+(.*?)\s+(?:for|at)\b/i);
  if (boughtMatch) {
    note = boughtMatch[1].trim();
  }

  // Pattern: "for <item>" — most common
  if (!note) {
    const forMatch = text.match(/\bfor\s+([^.]+?)(?:\s+(?:today|yesterday|tomorrow|this week|last week|this month|last month|on\s+\d)|\s*$)/i);
    if (forMatch) {
      note = forMatch[1].trim();
    }
  }

  // Pattern: "spent/paid <amount> on <item>"
  if (!note) {
    const onMatch = text.match(/\bon\s+([^.]+?)(?:\s+(?:today|yesterday|tomorrow|this week|last week|this month|last month)|\s*$)/i);
    if (onMatch) {
      note = onMatch[1].trim();
    }
  }

  // Fallback pattern: "<item> <amount> [date]" — leading item name with no preposition
  // Handles: "Cricket Turf 200 today", "Biryani 300", "Gym 500 yesterday"
  if (!note) {
    const leadingMatch = text.match(/^([a-zA-Z][a-zA-Z\s]*)\s+(?:₹|rs\.?|inr)?\s*\d+/i);
    if (leadingMatch) {
      note = leadingMatch[1].trim();
    }
  }

  if (note) {
    // Strip trailing date words and amounts
    note = note
      .replace(/\b(today|yesterday|tomorrow|this week|last week|this month|last month)\b.*/gi, "")
      .replace(/\b(?:₹|rs\.?|inr)?\s*\d+(?:[.,]\d+)?\b/gi, "") // remove stray amounts
      .replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()]/g, "")
      .trim();

    return note || undefined;
  }

  return undefined;
}

// ─── Intent classification ────────────────────────────────────────────────────

export function getChatIntent(message: string): ChatIntent {
  const normalized = message.trim().toLowerCase();
  const amount = parseAmount(message);
  const timeframe = buildDateRange(message);

  const hasQuestionIntent = /\b(what|show|tell|how|did|do|is|are|list|compare|summary|report)\b/.test(normalized);

  // ── Budget update ──
  const hasUpdateBudgetKeyword =
    /\b(set|update|change|adjust|raise|lower)\b.*\b(budget|monthly limit|monthly budget|limit)\b/.test(normalized) ||
    /\b(budget|monthly limit|monthly budget|limit)\b.*\b(set|update|change|adjust|raise|lower)\b/.test(normalized);
  const hasBudgetKeyword = /\b(budget|limit|monthly limit|monthly budget|overspend|overspending|remaining balance|under budget|over budget|save|savings)\b/.test(normalized);

  if (hasUpdateBudgetKeyword || (hasBudgetKeyword && amount && !hasQuestionIntent)) {
    return {
      type: "update_budget",
      details: { amount },
    };
  }

  // ── Add income ──
  const hasIncomeKeyword = /\b(income|salary|earned|revenue|received|bonus)\b/.test(normalized);
  const isAddIncome =
    /\b(add|create|record|log|received|earned)\b.*\b(income|salary|revenue|payment|bonus)\b/.test(normalized) ||
    (hasIncomeKeyword && amount && !hasQuestionIntent && !normalized.includes("bought") && !normalized.includes("spent"));

  if (isAddIncome) {
    const incomeDate = parseDateFromPhrase(message);
    return {
      type: "add_income",
      details: {
        amount,
        date: incomeDate,
        note: parseNote(message),
      },
    };
  }

  // ── Add expense ──
  //
  // We cast a wide net here so patterns like:
  //   "Add expense of 250 for taxi today"
  //   "Add 500 for groceries"
  //   "Spent 300 on dinner yesterday"
  //   "Paid 150 for medicine"
  //   "Add expense for badminton 250"
  // all get detected as add_expense intents.
  const hasExpenseKeyword = /\b(expense|spent|spend|purchase|bought|pay|paid|dinner|lunch|breakfast|taxi|cab|uber|coffee|shopping|shoes?|puma|groceries?|badminton|football|cricket|turf|gym)\b/.test(normalized);

  const isAddExpense =
    // Explicit "add/log/record expense" + optional "for/of"
    /\b(add|create|record|log)\b.*\b(expense|bill|transaction)\b/.test(normalized) ||
    // Broad "add <amount> for <item>" or "add expense of <amount> for <item>"
    /\b(add|log|record)\b.*\b(for|of)\b/.test(normalized) ||
    // Already-spent patterns
    /\b(spent|bought|paid)\b.*\b(for|on)\b/.test(normalized) ||
    // Starts with spending verb
    (amount !== undefined && (normalized.startsWith("spent") || normalized.startsWith("bought") || normalized.startsWith("paid"))) ||
    // Has expense keyword + amount, not a question
    (hasExpenseKeyword && amount !== undefined && !hasQuestionIntent);

  if (isAddExpense) {
    const expenseDate = parseDateFromPhrase(message);
    const note = parseNote(message);
    return {
      type: "add_expense",
      details: {
        amount,
        date: expenseDate,
        // Do NOT pre-set a category here — let server.ts resolve it from
        // the live user category list using the note text.
        note: note || undefined,
        // Preserve the original message for server-side category matching fallback
        originalMessage: message,
      },
    };
  }

  // ── Summaries ──
  if (hasBudgetKeyword) {
    return { type: "budget_status", timeframe };
  }

  if (hasIncomeKeyword && !hasExpenseKeyword) {
    return { type: "income_summary", timeframe };
  }

  if (hasExpenseKeyword) {
    return { type: "expense_summary", timeframe };
  }

  return { type: "unknown" };
}
