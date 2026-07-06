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

const categoryKeywords = [
  "food",
  "transport",
  "travel",
  "fuel",
  "groceries",
  "shopping",
  "rent",
  "utilities",
  "health",
  "medical",
  "education",
  "entertainment",
  "bills",
  "subscription",
  "other",
];

const amountRegex = /(?:₹|rs\.?|inr)?\s*([0-9]+(?:[.,][0-9]+)?)/i;
const dateRegex = /(today|yesterday|this week|last week|this month|last month|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i;

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
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

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

function parseAmount(text: string): number | undefined {
  const match = text.match(amountRegex);
  if (!match) return undefined;
  const parsed = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCategory(text: string): string | undefined {
  const normalized = text.toLowerCase();
  // If matched a specific category keyword
  const keyword = categoryKeywords.find((kw) => normalized.includes(kw));
  if (keyword) return keyword;

  // Otherwise check if a generic word is used as the category context
  const taxiMatch = /\b(taxi|cab|uber|ride|travel|bus|train|flight)\b/i.test(normalized);
  if (taxiMatch) return "travel";

  const sportsMatch = /\b(badminton|football|cricket|turf|sports|gym|tennis)\b/i.test(normalized);
  if (sportsMatch) return "sports";

  return undefined;
}

function parseNote(text: string, category?: string): string | undefined {
  const lower = text.toLowerCase();
  
  // Look for "for <item>" or "on <item>" or "bought <item>"
  let note: string | undefined = undefined;
  
  const boughtMatch = text.match(/\bbought\s+(.*?)\s+(?:for|at)\b/i);
  if (boughtMatch) {
    note = boughtMatch[1].trim();
  } else {
    const forIndex = lower.indexOf("for ");
    if (forIndex !== -1) {
      note = text.slice(forIndex + 4).trim();
    } else {
      const onIndex = lower.indexOf("on ");
      if (onIndex !== -1) {
        note = text.slice(onIndex + 3).trim();
      }
    }
  }

  if (note) {
    // Clean up trailing date markers
    note = note.replace(/\b(today|yesterday|tomorrow)\b.*$/i, "").trim();
    note = note.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    return note || undefined;
  }

  return undefined;
}

export function getChatIntent(message: string): ChatIntent {
  const normalized = message.trim().toLowerCase();
  const hasExpenseKeyword = /\b(expense|spent|spend|purchase|bought|pay|paid|dinner|lunch|breakfast|taxi|cab|uber|coffee|shopping|shoes?|puma)\b/.test(normalized);
  const hasIncomeKeyword = /\b(income|salary|earned|revenue|received|paid)\b/.test(normalized);
  const hasBudgetKeyword = /\b(budget|limit|monthly limit|monthly budget|overspend|overspending|remaining balance|under budget|over budget|save|savings)\b/.test(normalized);
  
  const amount = parseAmount(message);
  const timeframe = buildDateRange(message);
  const hasQuestionIntent = /\b(what|show|tell|how|did|do|is|are|list|compare|summary|report)\b/.test(normalized);

  const hasUpdateBudgetKeyword = /\b(set|update|change|adjust|raise|lower)\b.*\b(budget|monthly limit|monthly budget|limit)\b/.test(normalized) || /\b(budget|monthly limit|monthly budget|limit)\b.*\b(set|update|change|adjust|raise|lower)\b/.test(normalized);

  if (hasUpdateBudgetKeyword || (hasBudgetKeyword && amount && !hasQuestionIntent)) {
    return {
      type: "update_budget",
      details: {
        amount,
      },
    };
  }

  // Determine if it is a request to log income
  const isAddIncome = /\b(add|create|record|log|received|earned)\b.*\b(income|salary|revenue|payment|bonus)\b/.test(normalized) || 
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

  // Determine if it is a request to log expense
  const isAddExpense = /\b(add|create|record|log|spent|bought|paid)\b.*\b(expense|spent|purchase|bill|dinner|lunch|breakfast|taxi|cab|uber|coffee|shopping|shoes?|puma)\b/.test(normalized) || 
                       (hasExpenseKeyword && amount && !hasQuestionIntent) ||
                       (amount && (normalized.startsWith("spent") || normalized.startsWith("bought") || normalized.startsWith("paid")));

  if (isAddExpense) {
    const expenseDate = parseDateFromPhrase(message);
    const category = parseCategory(message);
    const note = parseNote(message, category);
    return {
      type: "add_expense",
      details: {
        amount,
        category,
        date: expenseDate,
        note: note || (category ? `Expense for ${category}` : "Expense"),
      },
    };
  }

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
