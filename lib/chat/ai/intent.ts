import type { AIIntentType, AIIntentResult, AIEntityResult } from "./types";
import { extractEntities } from "./entity-extractor";

const INTENT_PATTERNS: Array<{
  intent: AIIntentType;
  includeKeywords: string[];
  excludeKeywords: string[];
  requireAmount: boolean;
}> = [
  {
    intent: "add_expense",
    includeKeywords: [
      "spent", "spend", "paid", "bought", "buy", "purchase",
      "add expense", "log expense", "record expense", "new expense",
    ],
    excludeKeywords: [
      "summary", "total", "how much", "breakdown", "compare",
      "show", "tell", "list", "what is", "what are",
    ],
    requireAmount: true,
  },
  {
    intent: "add_income",
    includeKeywords: [
      "salary", "income", "received", "receive", "credited",
      "got", "earned", "bonus", "commission", "pocket money",
      "allowance", "add income", "log income", "record income",
    ],
    excludeKeywords: [
      "summary", "total", "how much", "show", "tell",
    ],
    requireAmount: true,
  },
  {
    intent: "update_budget",
    includeKeywords: [
      "set budget", "update budget", "change budget", "make budget",
      "budget should be", "budget set", "adjust budget",
    ],
    excludeKeywords: [
      "show", "what", "remaining", "left", "exceeded", "exceed",
      "used", "status", "progress", "utilization", "within", "compare",
    ],
    requireAmount: true,
  },
  {
    intent: "query_expense",
    includeKeywords: [
      "spending", "expense", "expenses", "spent", "how much",
      "total spend", "what did i spend",
    ],
    excludeKeywords: [
      "add", "log", "record", "new", "create",
    ],
    requireAmount: false,
  },
  {
    intent: "query_income",
    includeKeywords: [
      "income", "earned", "salary", "how much.*income",
      "total income", "income summary",
    ],
    excludeKeywords: [
      "add", "log", "record", "new", "create",
    ],
    requireAmount: false,
  },
  {
    intent: "query_savings",
    includeKeywords: [
      "save", "saving", "savings", "budget advice",
      "insight", "suggestion", "where can i save",
      "how can i save", "money saving",
    ],
    excludeKeywords: [],
    requireAmount: false,
  },
  {
    intent: "query_category",
    includeKeywords: [
      "category", "categories", "how much.*on",
      "what.*spend.*category", "category.*spend",
      "top category", "top spending",
    ],
    excludeKeywords: [
      "add", "create", "new category",
    ],
    requireAmount: false,
  },
  {
    intent: "query_comparison",
    includeKeywords: [
      "compare", "vs", "versus", "last month",
      "this month vs", "difference between",
      "month over month",
    ],
    excludeKeywords: [],
    requireAmount: false,
  },
  {
    intent: "create_category",
    includeKeywords: [
      "create category", "create subcategory",
      "add category", "new category", "make category",
    ],
    excludeKeywords: [],
    requireAmount: false,
  },
  {
    intent: "greeting",
    includeKeywords: [
      "hi", "hello", "hey", "namaste", "good morning",
      "good afternoon", "good evening", "whats up",
      "howdy", "yo", "hi there",
    ],
    excludeKeywords: [
      "expense", "income", "budget", "spend", "spent",
      "save", "money", "record", "add",
    ],
    requireAmount: false,
  },
];

const NEGATION_PREFIXES = [
  "don't", "do not", "dont",
  "never", "stop", "donot",
  "i don't want", "i do not want",
];

function hasNegation(message: string, matchIndex: number): boolean {
  const beforeMatch = message.slice(0, matchIndex).toLowerCase().trim();
  const lastWord = beforeMatch.split(/\s+/).pop() || "";
  return NEGATION_PREFIXES.some((neg) => beforeMatch.includes(neg))
    || lastWord === "not" || lastWord === "no";
}

function scoreIntent(
  message: string,
  pattern: typeof INTENT_PATTERNS[0],
): number {
  const lower = message.toLowerCase();
  let matchedCount = 0;
  let firstMatchIndex = -1;

  for (const keyword of pattern.includeKeywords) {
    const idx = lower.indexOf(keyword);
    if (idx !== -1) {
      matchedCount++;
      if (firstMatchIndex === -1 || idx < firstMatchIndex) {
        firstMatchIndex = idx;
      }
    }
  }

  if (matchedCount === 0) return 0;

  for (const exclude of pattern.excludeKeywords) {
    if (lower.includes(exclude)) {
      return matchedCount * 0.1;
    }
  }

  if (firstMatchIndex !== -1 && hasNegation(lower, firstMatchIndex)) {
    return matchedCount * 0.1;
  }

  const hasAmount = /\d[\d,]*(?:\.\d{1,4})?\s*(?:k|l|lakh)?/i.test(message);
  if (pattern.requireAmount && !hasAmount) {
    return matchedCount * 0.2;
  }

  const keywordRatio = matchedCount / pattern.includeKeywords.length;
  const score = Math.min(0.4 + keywordRatio * 0.6, 0.98);
  return score;
}

const BUDGET_READ_KEYWORDS = [
  "show", "what", "remaining", "left", "exceeded", "exceed",
  "used", "status", "progress", "utilization", "within", "compare",
];

export function classifyIntent(message: string): AIIntentResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return { intent: "unknown", confidence: 0, entities: {} };
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes("budget")) {
    const isReadQuery = BUDGET_READ_KEYWORDS.some((kw) => lower.includes(kw));
    if (!isReadQuery && /set|update|change|make|adjust/.test(lower)) {
      const hasAmount = /\d[\d,]*(?:\.\d{1,4})?\s*(?:k|l|lakh)?/i.test(trimmed);
      if (hasAmount) {
        const entities = extractEntities(trimmed);
        return { intent: "update_budget", confidence: 0.85, entities };
      }
    }
  }

  let bestScore = 0;
  let bestIntent: AIIntentType = "unknown";

  for (const pattern of INTENT_PATTERNS) {
    if (pattern.intent === "update_budget") continue;
    const score = scoreIntent(trimmed, pattern);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = pattern.intent;
    }
  }

  if (bestScore < 0.35) {
    return { intent: "unknown", confidence: bestScore, entities: {} };
  }

  if (lower.includes("budget") && bestScore < 0.5) {
    if (isSavingsQuery(lower)) {
      bestIntent = "query_savings";
      bestScore = 0.6;
    } else if (bestIntent === "unknown") {
      bestScore = 0.4;
    }
  }

  const entities = extractEntities(trimmed);

  return { intent: bestIntent, confidence: bestScore, entities };
}

function isSavingsQuery(lower: string): boolean {
  return /(save|saving|advice|suggestion|insight)/i.test(lower);
}
