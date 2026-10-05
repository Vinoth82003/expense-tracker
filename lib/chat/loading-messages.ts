/**
 * Progress narration for the chat panel's thinking indicator.
 *
 * This module is imported by a client component, so it must stay free of any
 * server-only import (no prisma, no AI SDKs) — everything here is plain data
 * plus a keyword classifier.
 *
 * The panel shows a fixed acknowledgement line first ("Analyzed your input…")
 * and then walks a queue tailored to what the user asked for, so an expense
 * entry reports expense-shaped work instead of replaying the same generic
 * spinner for every request.
 */

export type ProcessingIntent = "expense" | "income" | "budget" | "insight";

/** Shown once, before any of the step messages. */
export const PROCESSING_PREAMBLE = "Analyzed your input, now processing your request…";

/**
 * Per-intent step queues, ordered so the first thing shown is the work closest
 * to what the user asked for. Every entry comes from the pool the product
 * specified; an intent picks the slice of that pool that matches its work.
 */
export const PROCESSING_STEPS: Record<ProcessingIntent, string[]> = {
  expense: [
    "Analyzing your expenses...",
    "Validating your input...",
    "Fetching your financial data...",
    "Reviewing your transactions...",
    "Updating your records...",
  ],
  income: [
    "Fetching your financial data...",
    "Validating your input...",
    "Reviewing your transactions...",
    "Calculating your savings...",
    "Updating your records...",
  ],
  budget: [
    "Checking your budget...",
    "Analyzing your expenses...",
    "Validating your input...",
    "Optimizing your finances...",
    "Updating your records...",
  ],
  insight: [
    "Preparing your report...",
    "Fetching your financial data...",
    "Reviewing your transactions...",
    "Calculating your savings...",
    "Generating insights for you...",
  ],
};

/** Every step string the app can display, used to keep the queues honest. */
export const ALL_PROCESSING_MESSAGES = [
  "Analyzing your expenses...",
  "Checking your budget...",
  "Validating your input...",
  "Fetching your financial data...",
  "Preparing your report...",
  "Calculating your savings...",
  "Reviewing your transactions...",
  "Updating your records...",
  "Optimizing your finances...",
  "Generating insights for you...",
];

const INCOME_PATTERNS = [
  /\b(salary|income|paid\s+me|credited|received|earn|earned|payout|invoice|bonus|dividend|interest\s+earned|refund)\b/i,
  /\b(got|received|earned)\b/i,
];

const BUDGET_PATTERNS = [
  /\bbudget\b/i,
  /\b(limit|monthly\s+spend|cap|spending\s+limit)\b/i,
];

const EXPENSE_PATTERNS = [
  /\b(spent|spend|spends|paid|pay|pays|bought|buy|purchase|purchased|log|logged|add(?:ed)?\s+(?:an?\s+)?expense)\b/i,
  /\b(on|for)\s+(?:grocer\w*|food|taxi|rent|petrol|transport|coffee|uber|ola|metro|bus|train|flight|salary\b.*)/i,
];

const QUERY_PATTERNS = [
  /\b(how\s+much|what|show|tell|give|list|compare|breakdown|insight|report|summary|trend|status)\b/i,
  /\?$/,
];

const AMOUNT = /₹?\s?\d[\d,]*(?:\.\d{1,2})?/;

/**
 * Best-effort client-side intent guess used only to pick the narration queue.
 * The server still decides what the message actually means, so a wrong guess
 * costs nothing more than a slightly mismatched progress line.
 *
 * Order matters: an explicit budget or income noun beats the generic query
 * words, and "spent 500" beats "how much" so a transaction does not get
 * narrated as a report.
 */
export function detectProcessingIntent(message: string): ProcessingIntent {
  const text = (message || "").trim();
  if (!text) return "insight";

  const hasAmount = AMOUNT.test(text);
  const looksLikeTransaction = EXPENSE_PATTERNS.some((re) => re.test(text));
  const budgetish = BUDGET_PATTERNS.some((re) => re.test(text)) && /\b(set|update|change|increase|decrease|raise|adjust|make)\b/i.test(text);

  if (budgetish) return "budget";
  if (hasAmount && INCOME_PATTERNS.some((re) => re.test(text))) return "income";
  if (looksLikeTransaction && hasAmount) return "expense";
  if (BUDGET_PATTERNS.some((re) => re.test(text))) return "budget";

  const queryish = QUERY_PATTERNS.some((re) => re.test(text));
  if (queryish) return "insight";

  if (INCOME_PATTERNS.some((re) => re.test(text))) return "income";
  if (looksLikeTransaction) return "expense";
  return "insight";
}

/**
 * The full line sequence for a request: the preamble, then the intent's steps.
 * `count` caps the walk so a slow response does not run through every message
 * before the reply lands.
 */
export function buildProcessingTimeline(
  message: string,
  count = PROCESSING_STEPS.expense.length,
): string[] {
  const intent = detectProcessingIntent(message);
  return [PROCESSING_PREAMBLE, ...PROCESSING_STEPS[intent].slice(0, Math.max(0, count))];
}