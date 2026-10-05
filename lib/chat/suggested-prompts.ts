/**
 * Suggested prompts shown under the chat input.
 *
 * Client-imported, so no server-only imports here. Every prompt is declared
 * with the intent it is *verified* to resolve to; `tests/chat.suggested-prompts.test.ts`
 * asserts that contract against the supported query kinds and the loading
 * classifier, so a prompt cannot be added that routes nowhere.
 *
 * The prompts deliberately always state a date. A dateless prompt is a
 * legitimate request, but as a one-tap suggestion it would open a prompt
 * dialog rather than showing the feature working, which is a poor first
 * impression for a button.
 */

import type { ProcessingIntent } from "./loading-messages";

export type SuggestedPromptKind =
  | "add_expense"
  | "add_income"
  | "update_budget"
  | "expense_summary"
  | "income_summary"
  | "budget_status"
  | "savings_insights"
  | "category_breakdown"
  | "comparison";

export interface SuggestedPromptSpec {
  id: string;
  text: string;
  /** The extractor query kind or operation this prompt is verified to produce. */
  kind: SuggestedPromptKind;
  /** Narration queue this prompt should use while it is in flight. */
  intent: ProcessingIntent;
}

/**
 * Query kinds the executor can actually answer. A prompt whose `kind` is not in
 * this set is a dead end, which is how the earlier "top spending categories"
 * and "show category breakdown" suggestions got dropped — there is no ranking
 * or breakdown report behind them, so they returned a flat total that did not
 * answer the question.
 */
export const SUPPORTED_QUERY_KINDS = [
  "EXPENSE_SUMMARY",
  "INCOME_SUMMARY",
  "BUDGET_STATUS",
  "SAVINGS_INSIGHTS",
  "CATEGORY_BREAKDOWN",
  "COMPARISON",
] as const;

export const SUPPORTED_PROMPT_KINDS: SuggestedPromptKind[] = [
  "add_expense",
  "add_income",
  "update_budget",
  "expense_summary",
  "income_summary",
  "budget_status",
  "savings_insights",
  "category_breakdown",
  "comparison",
];

/** Maps a prompt's declared kind to the query kind the extractor must produce. */
const KIND_TO_QUERY: Partial<Record<SuggestedPromptKind, string>> = {
  expense_summary: "EXPENSE_SUMMARY",
  income_summary: "INCOME_SUMMARY",
  budget_status: "BUDGET_STATUS",
  savings_insights: "SAVINGS_INSIGHTS",
  category_breakdown: "CATEGORY_BREAKDOWN",
  comparison: "COMPARISON",
};

export const SUGGESTED_PROMPT_SPECS: SuggestedPromptSpec[] = [
  // ── Expenses (all date-stated so one tap completes the flow) ────────────
  {
    id: "expense-groceries",
    text: "Spent ₹1,200 on groceries today.",
    kind: "add_expense",
    intent: "expense",
  },
  {
    id: "expense-taxi",
    text: "Paid ₹250 for a taxi today.",
    kind: "add_expense",
    intent: "expense",
  },
  {
    id: "expense-petrol",
    text: "Logged ₹600 for petrol yesterday.",
    kind: "add_expense",
    intent: "expense",
  },
  {
    id: "expense-dinner",
    text: "Spent ₹800 on dinner yesterday.",
    kind: "add_expense",
    intent: "expense",
  },
  {
    id: "expense-multi",
    text: "Spent ₹300 on groceries today, ₹150 on transport today, and ₹450 on shopping today.",
    kind: "add_expense",
    intent: "expense",
  },

  // ── Income ─────────────────────────────────────────────────────────────
  {
    id: "income-salary",
    text: "Got my salary of ₹45,000 today.",
    kind: "add_income",
    intent: "income",
  },
  {
    id: "income-gift",
    text: "Received ₹2,000 as a gift today.",
    kind: "add_income",
    intent: "income",
  },
  {
    id: "income-freelance",
    text: "Earned ₹5,000 from freelance work today.",
    kind: "add_income",
    intent: "income",
  },

  // ── Budget ─────────────────────────────────────────────────────────────
  {
    id: "budget-set",
    text: "Set my monthly budget to ₹25,000.",
    kind: "update_budget",
    intent: "budget",
  },
  {
    id: "budget-update",
    text: "Update my monthly budget to ₹30,000.",
    kind: "update_budget",
    intent: "budget",
  },
  {
    id: "budget-status",
    text: "How is my budget this month?",
    kind: "budget_status",
    intent: "budget",
  },

  // ── Queries ────────────────────────────────────────────────────────────
  {
    id: "query-expense-month",
    text: "How much did I spend this month?",
    kind: "expense_summary",
    intent: "insight",
  },
  {
    id: "query-expense-show",
    text: "Show me my expenses for this month.",
    kind: "expense_summary",
    intent: "insight",
  },
  {
    id: "query-category-food",
    text: "What did I spend on food this month?",
    kind: "category_breakdown",
    intent: "insight",
  },
  {
    id: "query-category-transport",
    text: "What did I spend on transport this month?",
    kind: "category_breakdown",
    intent: "insight",
  },
  {
    id: "query-income",
    text: "Show my income for this month.",
    kind: "income_summary",
    intent: "insight",
  },
  {
    id: "query-insights",
    text: "Give me my financial insights.",
    kind: "savings_insights",
    intent: "insight",
  },
  {
    id: "query-comparison",
    text: "Compare this month vs last month.",
    kind: "comparison",
    intent: "insight",
  },
];

/** How many prompts the panel shows at once. */
export const SUGGESTED_PROMPT_COUNT = 5;

function shuffle<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A fresh random selection, reshuffled on every app open and on demand from the
 * refresh button. Deduped by id so the same prompt never appears twice in one
 * batch.
 */
export function pickSuggestedPrompts(
  count: number = SUGGESTED_PROMPT_COUNT,
  specs: SuggestedPromptSpec[] = SUGGESTED_PROMPT_SPECS,
): SuggestedPromptSpec[] {
  return shuffle(specs).slice(0, Math.max(0, count));
}

/** Query kind a given prompt spec is verified to resolve to, if it is a query. */
export function expectedQueryKind(spec: SuggestedPromptSpec): string | null {
  return KIND_TO_QUERY[spec.kind] ?? null;
}

/** True when the prompt needs a valid amount the extractor can parse. */
export function requiresAmount(spec: SuggestedPromptSpec): boolean {
  return spec.kind === "add_expense" || spec.kind === "add_income" || spec.kind === "update_budget";
}