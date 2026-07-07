import {
  endOfMonth,
  format,
  isAfter,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import {
  createExpense,
  createIncome,
  fetchBudget,
  fetchCategories,
  fetchExpenses,
  fetchIncome,
  updateExpense,
  createCategory,
  updateBudget,
} from "../v1/api-gateway";

type ChatEventType = "expenseAdded" | "incomeAdded" | "budgetUpdated";

type SessionKind =
  | "expense_missing"
  | "income_missing"
  | "confirm_amount_rounding"
  | "confirm_ambiguous_date"
  | "confirm_old_date"
  | "choose_expense_category"
  | "confirm_duplicate_category"
  | "suggest_new_category"
  | "confirm_bulk_move"
  | "pick_bulk_move"
  | "create_category_direct";

type ParentType = "Needs" | "Wants";
type IncomeCategory = "Salary" | "Gift" | "Investment" | "Freelance" | "Others";

type DraftTransaction = {
  mode: "expense" | "income";
  amount?: number;
  amountRaw?: string;
  amountApproximate?: boolean;
  needsRoundingConfirmation?: boolean;
  roundedAmount?: number;
  note?: string;
  sanitizedNote?: string;
  date?: string;
  ambiguousDateInput?: string;
  needsOldDateConfirmation?: boolean;
  category?: string;
  categoryType?: ParentType;
  categoryConfidence?: number;
  categoryCandidates?: string[];
  incomeCategory?: IncomeCategory;
  createCategory?: boolean;
  suggestedCategory?: string;
  matchingExpenseIds?: string[];
};

type ChatCategory = {
  id: string;
  name: string;
  type: ParentType;
  isDefault?: boolean;
  userId?: string | null;
};

type V2Session = {
  id: string;
  kind: SessionKind;
  createdAt: string;
  originMessage: string;
  step?: string;
  draft?: DraftTransaction;
  options?: string[];
  duplicateName?: string;
  parentType?: ParentType;
  moveCandidates?: Array<{
    id: string;
    note: string;
    amount: number;
    date: string;
  }>;
};

type V2Context = {
  v2?: {
    session?: V2Session | null;
  };
  [key: string]: unknown;
};

type V2UIOption = {
  id: string;
  label: string;
  action: "submit" | "cancel";
  value?: string;
  variant?: "primary" | "secondary" | "danger";
};

type V2FollowUpPayload = {
  ui: "v2";
  kind: "date" | "choices" | "confirm" | "multiselect";
  sessionId: string;
  prompt: string;
  helperText?: string;
  options: V2UIOption[];
  allowDateInput?: boolean;
  allowTextInput?: boolean;
  maxDate?: string;
  items?: Array<{
    id: string;
    label: string;
    checked?: boolean;
  }>;
};

type V2Result =
  | { handled: false }
  | {
      handled: true;
      reply: string;
      success?: boolean;
      eventType?: ChatEventType;
      data?: unknown;
      context?: V2Context;
      followUp?: { type: string; payload: V2FollowUpPayload };
    };

type RequestEnvelope = {
  body: any;
  userId: string;
  request: Request;
};

const FIXED_INCOME_CATEGORIES: IncomeCategory[] = [
  "Salary",
  "Gift",
  "Investment",
  "Freelance",
  "Others",
];

const EXPENSE_KEYWORDS = [
  "spent",
  "spend",
  "paid",
  "bought",
  "buy",
  "purchase",
  "add expense",
  "log expense",
];

const INCOME_KEYWORDS = [
  "salary",
  "income",
  "received",
  "receive",
  "credited",
  "got",
  "earned",
];

const CATEGORY_KEYWORDS: Array<{
  category: string;
  type: ParentType;
  keywords: string[];
}> = [
  { category: "Food", type: "Needs", keywords: ["food", "lunch", "dinner", "breakfast", "groceries", "grocery"] },
  { category: "Utilities", type: "Needs", keywords: ["wifi", "internet", "electricity", "water", "gas", "utility", "broadband", "recharge"] },
  { category: "Transport", type: "Needs", keywords: ["taxi", "uber", "ola", "metro", "bus", "fuel", "petrol", "diesel", "transport"] },
  { category: "Health", type: "Needs", keywords: ["medicine", "doctor", "hospital", "pharmacy", "health"] },
  { category: "Shopping", type: "Wants", keywords: ["shopping", "laptop", "phone", "dress", "shoes", "amazon"] },
  { category: "Entertainment", type: "Wants", keywords: ["movie", "netflix", "game", "gaming", "concert", "entertainment"] },
  { category: "Sports", type: "Wants", keywords: ["cricket", "football", "turf", "badminton", "sports", "gym"] },
];

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function sanitizeFreeText(value?: string | null, maxLength = 80) {
  if (!value) return "";
  return value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeName(value: string) {
  return sanitizeFreeText(value).toLowerCase();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function makeSessionId() {
  return `v2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withSession(context: V2Context, session: V2Session | null): V2Context {
  return {
    ...context,
    v2: {
      ...(context?.v2 || {}),
      session,
    },
  };
}

function buildFollowUp(
  context: V2Context,
  session: V2Session,
  payload: Omit<V2FollowUpPayload, "ui" | "sessionId">,
  reply?: string,
): V2Result {
  return {
    handled: true,
    reply: reply || payload.prompt,
    success: false,
    context: withSession(context, session),
    followUp: {
      type: "v2_interaction",
      payload: {
        ui: "v2",
        sessionId: session.id,
        ...payload,
      },
    },
  };
}

function clearSession(context: V2Context): V2Context {
  return withSession(context, null);
}

function isExpenseMessage(message: string) {
  const lower = message.toLowerCase();
  return EXPENSE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isIncomeMessage(message: string) {
  const lower = message.toLowerCase();
  return INCOME_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isCrossUserDataRequest(message: string) {
  const lower = message.toLowerCase();
  const hasDataRequest = /\b(show|tell|give|list|fetch|get|read|display|reveal)\b/.test(lower);
  const hasFinancialScope = /\b(spending|expenses?|income|budget|transactions?|data|records?)\b/.test(lower);
  const targetsAnotherUser =
    /\buser\s*(?:id|with\s+id)?\s*[:#-]?\s*[a-z0-9_-]+\b/i.test(message) ||
    /\b(?:another|other)\s+users?\b/i.test(message) ||
    /\bsomeone\s+else\b/i.test(message);
  const hasInstructionOverride = /\b(ignore|forget|disregard|override)\b.*\b(previous|prior|above|rules?|instructions?)\b/i.test(message);

  return (hasDataRequest && hasFinancialScope && targetsAnotherUser) || (hasInstructionOverride && targetsAnotherUser);
}

function isSavingsQuery(message: string) {
  return /(save|saving|budget|advice|suggestion|insight)/i.test(message);
}

function isBudgetUpdateMessage(message: string) {
  const lower = message.toLowerCase();
  if (!lower.includes("budget")) return false;
  if (!/\b(set|update|change|make|adjust)\b|\bshould\s+be\b/i.test(lower)) return false;
  if (/\b(show|what|remaining|left|exceeded|exceed|used|status|progress|utilization|within|compare)\b/i.test(lower)) {
    return false;
  }
  return !("error" in parseAmount(message));
}

function isExpenseSummaryQuery(message: string) {
  return /(expense|spend|spent).*(summary|total|how much|breakdown|category)/i.test(message)
    || /(what are my top spending categories|top spending)/i.test(message);
}

function isIncomeSummaryQuery(message: string) {
  return /(income|salary|earned|received).*(summary|total|how much)/i.test(message);
}

function isDirectCategoryCreation(message: string) {
  return /^create\s+(?:sub)?category\s+/i.test(message.trim());
}

function parseAmount(message: string) {
  const match = message.match(/(-?\d[\d,]*(?:\.\d{1,4})?)\s*(k|l|lakh)?/i);
  if (!match) {
    return { error: "missing" as const };
  }

  const rawValue = match[1].replace(/,/g, "");
  const suffix = (match[2] || "").toLowerCase();
  const approximate = /\b(about|around|approx|approximately)\b/i.test(message);
  let amount = Number(rawValue);

  if (Number.isNaN(amount)) {
    return { error: "unparseable" as const };
  }

  if (suffix === "k") amount *= 1000;
  if (suffix === "l" || suffix === "lakh") amount *= 100000;

  if (amount < 0) {
    return { error: "negative" as const };
  }

  if (amount === 0) {
    return { error: "zero" as const };
  }

  const decimals = rawValue.includes(".") ? rawValue.split(".")[1].length : 0;
  if (decimals > 2) {
    return {
      amount: Number(amount.toFixed(2)),
      rounded: true,
      approximate,
      raw: match[0],
    };
  }

  return { amount, rounded: false, approximate, raw: match[0] };
}

function parseDateInput(input: string) {
  const trimmed = input.trim();
  const now = new Date();
  const today = startOfDay(now);
  const lower = trimmed.toLowerCase();

  if (lower === "today") {
    return { date: format(today, "yyyy-MM-dd"), label: "today" };
  }
  if (lower === "yesterday") {
    return { date: format(startOfDay(subDays(today, 1)), "yyyy-MM-dd"), label: "yesterday" };
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const lastWeekdayMatch = lower.match(/^last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (lastWeekdayMatch) {
    const target = weekdayMap[lastWeekdayMatch[1]];
    const d = new Date(today);
    do {
      d.setDate(d.getDate() - 1);
    } while (d.getDay() !== target);
    return { date: format(startOfDay(d), "yyyy-MM-dd"), label: trimmed };
  }

  const ambiguousMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (ambiguousMatch) {
    const first = Number(ambiguousMatch[1]);
    const second = Number(ambiguousMatch[2]);
    const year = ambiguousMatch[3].length === 2 ? `20${ambiguousMatch[3]}` : ambiguousMatch[3];
    if (first <= 12 && second <= 12) {
      return {
        ambiguous: true,
        original: trimmed,
        candidateDate: `${year}-${ambiguousMatch[2].padStart(2, "0")}-${ambiguousMatch[1].padStart(2, "0")}`,
      };
    }

    const preferred = parse(`${first}-${second}-${year}`, "d-M-yyyy", now);
    if (isValid(preferred)) {
      return { date: format(preferred, "yyyy-MM-dd"), label: trimmed };
    }
  }

  const formats = ["yyyy-MM-dd", "d MMM yyyy", "d MMMM yyyy", "d/M/yyyy", "d-M-yyyy", "M/d/yyyy", "M-d-yyyy"];
  for (const dateFormat of formats) {
    const parsed = parse(trimmed, dateFormat, now);
    if (isValid(parsed)) {
      return { date: format(parsed, "yyyy-MM-dd"), label: trimmed };
    }
  }

  return { error: "unparseable" as const };
}

function parseExpenseNote(message: string) {
  const cleaned = sanitizeFreeText(
    message
      .replace(/₹/g, "")
      .replace(/-?\d[\d,]*(?:\.\d{1,4})?\s*(?:k|l|lakh)?/gi, "")
      .replace(/\b(today|yesterday|last\s+\w+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi, "")
      .replace(/\b(spent|spend|paid|bought|buy|purchase|for|on|add|expense|log|record)\b/gi, ""),
  );
  return cleaned ? titleCase(cleaned) : "";
}

function inferIncomeCategory(message: string): IncomeCategory | undefined {
  const lower = message.toLowerCase();
  if (/\bsalary\b/.test(lower)) return "Salary";
  if (/\b(uncle|dad|mom|father|mother|gift|gave me)\b/.test(lower)) return "Gift";
  if (/\b(returns|dividend|interest|investment)\b/.test(lower)) return "Investment";
  // for Freelance
  if (/\b(freelance|freelancer|contract|project|client)\b/.test(lower)) return "Freelance";
  if (/\b(received|got|earned)\b/.test(lower)) return "Others";
  return undefined;
}

function parseRelativeRange(message: string) {
  const lower = message.toLowerCase();
  const now = new Date();

  if (lower.includes("today")) {
    const date = startOfDay(now);
    return {
      fromDate: format(date, "yyyy-MM-dd"),
      toDate: format(date, "yyyy-MM-dd"),
      label: "today",
    };
  }

  if (lower.includes("yesterday")) {
    const date = startOfDay(subDays(now, 1));
    return {
      fromDate: format(date, "yyyy-MM-dd"),
      toDate: format(date, "yyyy-MM-dd"),
      label: "yesterday",
    };
  }

  if (lower.includes("last month")) {
    const month = subMonths(now, 1);
    return {
      fromDate: format(startOfMonth(month), "yyyy-MM-dd"),
      toDate: format(endOfMonth(month), "yyyy-MM-dd"),
      label: format(month, "MMMM yyyy"),
    };
  }

  return {
    fromDate: format(startOfMonth(now), "yyyy-MM-dd"),
    toDate: format(endOfMonth(now), "yyyy-MM-dd"),
    label: format(now, "MMMM yyyy"),
  };
}

function similarity(a: string, b: string) {
  const aTokens = new Set(normalizeName(a).split(/\s+/).filter(Boolean));
  const bTokens = new Set(normalizeName(b).split(/\s+/).filter(Boolean));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size || 1;
  return intersection / union;
}

function findCategoryCandidates(note: string, categories: ChatCategory[]) {
  const normalizedNote = normalizeName(note);
  const scored = categories
    .map((category) => {
      const directScore = normalizedNote.includes(normalizeName(category.name)) ? 0.9 : 0;
      const keywordScore =
        CATEGORY_KEYWORDS.find(
          (entry) =>
            normalizeName(entry.category) === normalizeName(category.name) &&
            entry.keywords.some((keyword) => normalizedNote.includes(keyword)),
        ) ? 0.82 : 0;
      const fuzzyScore = similarity(note, category.name);
      return {
        category,
        score: Math.max(directScore, keywordScore, fuzzyScore),
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

async function getUserCategories(request: Request) {
  const response = await fetchCategories({ req: request });
  return (response?.categories || []) as ChatCategory[];
}

function parseDirectCategoryRequest(message: string) {
  const match = message.match(/^create\s+(?:sub)?category\s+(.+?)\s+under\s+(needs|wants)$/i);
  if (!match) return null;
  return {
    name: titleCase(match[1]),
    type: titleCase(match[2]) as ParentType,
  };
}

function findNearDuplicate(name: string, type: ParentType, categories: ChatCategory[]) {
  const normalized = normalizeName(name);
  return (
    categories.find((category) => category.type === type && normalizeName(category.name) === normalized) ||
    categories.find(
      (category) =>
        category.type === type &&
        similarity(category.name, name) >= 0.75,
    )
  );
}

async function maybeSuggestNewCategory(
  note: string,
  request: Request,
  draft: DraftTransaction,
) {
  const expenses = await fetchExpenses({}, { req: request });
  const candidates = (expenses?.expenses || []).filter(
    (expense: any) =>
      normalizeName(expense.subcategory || "") === "other" &&
      expense.note &&
      similarity(expense.note, note) >= 0.34,
  );

  if (candidates.length < 2) {
    return null;
  }

  const keywordEntry = CATEGORY_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => normalizeName(note).includes(keyword)),
  );
  const suggestedName = keywordEntry?.category || titleCase(note.split(/\s+/)[0] || "Other");

  return {
    suggestedName,
    parentType: keywordEntry?.type || "Wants",
    moveCandidates: candidates.slice(0, 5).map((expense: any) => ({
      id: expense.id,
      note: sanitizeFreeText(expense.note || expense.subcategory || "Expense"),
      amount: Number(expense.amount),
      date: format(new Date(expense.date), "yyyy-MM-dd"),
    })),
    matchingIds: candidates.map((expense: any) => expense.id),
  };
}

async function finalizeExpense(
  context: V2Context,
  request: Request,
  draft: DraftTransaction,
) {
  const payload = {
    amount: draft.amount,
    category: draft.categoryType,
    subcategory: draft.category,
    note: draft.sanitizedNote || draft.note || draft.category,
    date: draft.date,
  };

  const response = await createExpense(payload, { req: request });
  return {
    handled: true as const,
    reply: `Added ${formatCurrency(Number(draft.amount))} under ${draft.categoryType} → ${draft.category} on ${draft.date}.`,
    success: true,
    eventType: "expenseAdded" as const,
    data: response?.expense || response,
    context: clearSession(context),
  };
}

async function maybeConfirmBulkMove(
  context: V2Context,
  request: Request,
  sessionBase: V2Session,
  draft: DraftTransaction,
) {
  if (!draft.createCategory || !draft.matchingExpenseIds?.length) {
    return finalizeExpense(context, request, draft);
  }

  const allExpenses = await fetchExpenses({}, { req: request });
  const moveCandidates = (allExpenses?.expenses || [])
    .filter((expense: any) => draft.matchingExpenseIds?.includes(expense.id))
    .map((expense: any) => ({
      id: expense.id,
      note: sanitizeFreeText(expense.note || expense.subcategory || "Expense"),
      amount: Number(expense.amount),
      date: format(new Date(expense.date), "yyyy-MM-dd"),
    }));

  if (!moveCandidates.length) {
    return finalizeExpense(context, request, draft);
  }

  const preview = moveCandidates
    .slice(0, 2)
    .map((item: { note: string; amount: number }) => `'${item.note}' (${formatCurrency(item.amount)})`)
    .join(" and ");

  const session: V2Session = {
    ...sessionBase,
    kind: moveCandidates.length >= 3 ? "pick_bulk_move" : "confirm_bulk_move",
    draft,
    moveCandidates,
  };

  if (moveCandidates.length >= 3) {
    return buildFollowUp(context, session, {
      kind: "multiselect",
      prompt: `Move ${moveCandidates.length} earlier expenses into '${draft.category}'?`,
      helperText: "Pick which ones to move, or cancel to keep history unchanged.",
      items: moveCandidates.map((item: { id: string; note: string; amount: number; date: string }) => ({
        id: item.id,
        label: `${item.note} • ${formatCurrency(item.amount)} • ${item.date}`,
        checked: true,
      })),
      options: [
        { id: "move-selected", label: "Move selected", action: "submit", variant: "primary" },
        { id: "skip", label: "No", action: "submit", variant: "secondary" },
        { id: "cancel", label: "Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  return buildFollowUp(context, session, {
    kind: "confirm",
    prompt: `Move ${moveCandidates.length} expenses — ${preview} — into '${draft.category}'?`,
    options: [
      { id: "move-all", label: "Yes, move both", action: "submit", variant: "primary" },
      { id: "skip", label: "No", action: "submit", variant: "secondary" },
      { id: "cancel", label: "Cancel", action: "cancel", variant: "danger" },
    ],
    allowTextInput: false,
  });
}

async function continueExpenseDraft(
  context: V2Context,
  request: Request,
  originMessage: string,
  draft: DraftTransaction,
) {
  const sessionBase: V2Session = {
    id: makeSessionId(),
    kind: "expense_missing",
    createdAt: new Date().toISOString(),
    originMessage,
    draft,
  };

  if (draft.needsRoundingConfirmation && draft.roundedAmount !== undefined) {
    const session: V2Session = {
      ...sessionBase,
      kind: "confirm_amount_rounding",
    };
    return buildFollowUp(context, session, {
      kind: "confirm",
      prompt: `That amount has more than 2 decimal places. Save it as ${formatCurrency(draft.roundedAmount)}?`,
      options: [
        { id: "confirm-rounded-amount", label: "Confirm", action: "submit", variant: "primary" },
        { id: "cancel", label: "Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  if (!draft.note) {
    const session: V2Session = {
      ...sessionBase,
      kind: "expense_missing",
      step: "note",
    };
    return buildFollowUp(context, session, {
      kind: "choices",
      prompt: `What was this ${formatCurrency(Number(draft.amount || 0))} for?`,
      helperText: "Reply with the item name, or cancel to discard this draft.",
      options: [{ id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" }],
      allowTextInput: true,
    });
  }

  if (!draft.date) {
    const session: V2Session = {
      ...sessionBase,
      kind: "expense_missing",
      step: "date",
    };
    return buildFollowUp(context, session, {
      kind: "date",
      prompt: "What date should I use for this expense?",
      helperText: "Choose a quick option, pick a date, or cancel.",
      options: [
        { id: "today", label: "Today", action: "submit", value: "today", variant: "primary" },
        { id: "yesterday", label: "Yesterday", action: "submit", value: "yesterday", variant: "secondary" },
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowDateInput: true,
      allowTextInput: true,
      maxDate: format(new Date(), "yyyy-MM-dd"),
    });
  }

  if (draft.ambiguousDateInput) {
    const session: V2Session = {
      ...sessionBase,
      kind: "confirm_ambiguous_date",
    };
    const parsedDate = draft.date || "";
    return buildFollowUp(context, session, {
      kind: "confirm",
      prompt: `${draft.ambiguousDateInput} — did you mean DD-MM-YYYY (${format(new Date(parsedDate), "do MMMM yyyy")})?`,
      options: [
        { id: "confirm-date", label: "Confirm", action: "submit", variant: "primary" },
        { id: "pick-date", label: "Pick different date", action: "submit", value: "pick-date", variant: "secondary" },
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowDateInput: true,
      maxDate: format(new Date(), "yyyy-MM-dd"),
    });
  }

  if (draft.needsOldDateConfirmation) {
    const session: V2Session = {
      ...sessionBase,
      kind: "confirm_old_date",
    };
    return buildFollowUp(context, session, {
      kind: "confirm",
      prompt: "That date is a while back. Are you sure you want to use it?",
      options: [
        { id: "confirm-old-date", label: "Yes, continue", action: "submit", variant: "primary" },
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  const categories = await getUserCategories(request);
  const candidates = findCategoryCandidates(draft.note, categories);
  const best = candidates[0];

  if (!best || best.score < 0.7) {
    const suggestion = await maybeSuggestNewCategory(draft.note, request, draft);
    if (suggestion) {
      const duplicate = findNearDuplicate(
        suggestion.suggestedName,
        suggestion.parentType,
        categories,
      );

      if (duplicate) {
        const session: V2Session = {
          ...sessionBase,
          kind: "confirm_duplicate_category",
          draft: {
            ...draft,
            suggestedCategory: suggestion.suggestedName,
          },
          duplicateName: duplicate.name,
          parentType: duplicate.type,
        };
        return buildFollowUp(context, session, {
          kind: "choices",
          prompt: `You already have a '${duplicate.name}' category — use that instead?`,
          options: [
            { id: "use-duplicate", label: `Use ${duplicate.name}`, action: "submit", variant: "primary" },
            { id: "create-anyway", label: `Create ${suggestion.suggestedName} anyway`, action: "submit", variant: "secondary" },
            { id: "skip", label: "Skip", action: "submit", variant: "secondary" },
            { id: "cancel", label: "Cancel", action: "cancel", variant: "danger" },
          ],
          allowTextInput: false,
        });
      }

      const session: V2Session = {
        ...sessionBase,
        kind: "suggest_new_category",
        draft: {
          ...draft,
          suggestedCategory: suggestion.suggestedName,
          matchingExpenseIds: suggestion.matchingIds,
        },
        parentType: suggestion.parentType,
        moveCandidates: suggestion.moveCandidates,
      };
      return buildFollowUp(context, session, {
        kind: "choices",
        prompt: `I can create a '${suggestion.suggestedName}' subcategory for this. What would you like to do?`,
        helperText: "You can use the suggestion, create your own name in chat, or skip and keep this under Other.",
        options: [
          { id: "use-suggested-category", label: `Use ${suggestion.suggestedName}`, action: "submit", variant: "primary" },
          { id: "skip", label: "Skip", action: "submit", variant: "secondary" },
          { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
        ],
        allowTextInput: true,
      });
    }

    const shortlist = candidates.map((entry) => entry.category.name);
    const session: V2Session = {
      ...sessionBase,
      kind: "choose_expense_category",
      draft: {
        ...draft,
        categoryCandidates: shortlist,
      },
    };
    return buildFollowUp(context, session, {
      kind: "choices",
      prompt: `I’m not confident enough to choose a category for '${draft.note}'. Please pick one.`,
      helperText: "Reply with one of the choices, type a custom subcategory, or cancel.",
      options: [
        ...shortlist.map((name, index) => ({
          id: `candidate-${index + 1}`,
          label: name,
          action: "submit" as const,
          value: name,
          variant: index === 0 ? "primary" as const : "secondary" as const,
        })),
        { id: "other", label: "Other", action: "submit" as const, value: "Other", variant: "secondary" as const },
        { id: "cancel", label: "Skip & Cancel", action: "cancel" as const, variant: "danger" as const },
      ],
      allowTextInput: true,
    });
  }

  draft.category = best.category.name;
  draft.categoryType = best.category.type;
  draft.categoryConfidence = best.score;
  draft.sanitizedNote = sanitizeFreeText(draft.note, 120);

  return maybeConfirmBulkMove(context, request, sessionBase, draft);
}

async function continueIncomeDraft(
  context: V2Context,
  request: Request,
  originMessage: string,
  draft: DraftTransaction,
) {
  const sessionBase: V2Session = {
    id: makeSessionId(),
    kind: "income_missing",
    createdAt: new Date().toISOString(),
    originMessage,
    draft,
  };

  if (draft.needsRoundingConfirmation && draft.roundedAmount !== undefined) {
    const session: V2Session = { ...sessionBase, kind: "confirm_amount_rounding" };
    return buildFollowUp(context, session, {
      kind: "confirm",
      prompt: `That amount has more than 2 decimal places. Save it as ${formatCurrency(draft.roundedAmount)}?`,
      options: [
        { id: "confirm-rounded-amount", label: "Confirm", action: "submit", variant: "primary" },
        { id: "cancel", label: "Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  if (!draft.incomeCategory) {
    const session: V2Session = {
      ...sessionBase,
      kind: "income_missing",
      step: "income-category",
    };
    return buildFollowUp(context, session, {
      kind: "choices",
      prompt: "Which income category should I use?",
      options: [
        ...FIXED_INCOME_CATEGORIES.map((name, index) => ({
          id: `income-${index}`,
          label: name,
          action: "submit" as const,
          value: name,
          variant: index === 0 ? "primary" as const : "secondary" as const,
        })),
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  if (!draft.date) {
    const session: V2Session = {
      ...sessionBase,
      kind: "income_missing",
      step: "date",
    };
    return buildFollowUp(context, session, {
      kind: "date",
      prompt: "What date should I use for this income?",
      options: [
        { id: "today", label: "Today", action: "submit", value: "today", variant: "primary" },
        { id: "yesterday", label: "Yesterday", action: "submit", value: "yesterday", variant: "secondary" },
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowDateInput: true,
      allowTextInput: true,
      maxDate: format(new Date(), "yyyy-MM-dd"),
    });
  }

  if (draft.ambiguousDateInput) {
    const session: V2Session = {
      ...sessionBase,
      kind: "confirm_ambiguous_date",
    };
    return buildFollowUp(context, session, {
      kind: "confirm",
      prompt: `${draft.ambiguousDateInput} — did you mean DD-MM-YYYY (${format(new Date(draft.date || ""), "do MMMM yyyy")})?`,
      options: [
        { id: "confirm-date", label: "Confirm", action: "submit", variant: "primary" },
        { id: "pick-date", label: "Pick different date", action: "submit", value: "pick-date", variant: "secondary" },
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowDateInput: true,
      maxDate: format(new Date(), "yyyy-MM-dd"),
    });
  }

  if (draft.needsOldDateConfirmation) {
    const session: V2Session = {
      ...sessionBase,
      kind: "confirm_old_date",
    };
    return buildFollowUp(context, session, {
      kind: "confirm",
      prompt: "That date is a while back. Are you sure you want to use it?",
      options: [
        { id: "confirm-old-date", label: "Yes, continue", action: "submit", variant: "primary" },
        { id: "cancel", label: "Skip & Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  const note = sanitizeFreeText(draft.note || draft.incomeCategory, 120) || draft.incomeCategory;
  const response = await createIncome(
    {
      amount: draft.amount,
      source: draft.incomeCategory,
      note,
      date: draft.date,
    },
    { req: request },
  );

  return {
    handled: true as const,
    reply: `Added ${formatCurrency(Number(draft.amount))} as ${draft.incomeCategory} on ${draft.date}.`,
    success: true,
    eventType: "incomeAdded" as const,
    data: response?.income || response,
    context: clearSession(context),
  };
}

function applyDateValidationToDraft(draft: DraftTransaction, parsed: ReturnType<typeof parseDateInput>) {
  if ("error" in parsed) {
    return "I couldn't understand that date. Try a format like 2026-07-07, 7 July 2026, today, or yesterday.";
  }
  if ("ambiguous" in parsed && parsed.ambiguous) {
    draft.date = parsed.candidateDate;
    draft.ambiguousDateInput = parsed.original;
    return null;
  }

  const parsedValue = parsed.date;
  if (!parsedValue) {
    return "I couldn't understand that date. Try a format like 2026-07-07, 7 July 2026, today, or yesterday.";
  }
  const parsedDate = startOfDay(new Date(parsedValue));
  if (isAfter(parsedDate, startOfDay(new Date()))) {
    return "You can't log an expense or income for a future date.";
  }

  draft.date = parsedValue;
  draft.ambiguousDateInput = undefined;
  if (parsedDate.getFullYear() < 2000 || new Date().getFullYear() - parsedDate.getFullYear() > 5) {
    draft.needsOldDateConfirmation = true;
  } else {
    draft.needsOldDateConfirmation = false;
  }
  return null;
}

async function resumeSessionFromMessage(
  context: V2Context,
  request: Request,
  session: V2Session,
  message: string,
) {
  const lower = message.toLowerCase().trim();
  if (lower === "cancel" || lower === "skip" || lower === "skip & cancel") {
    return {
      handled: true as const,
      reply: "Cancelled this draft. Nothing was saved.",
      success: false,
      context: clearSession(context),
    };
  }

  const draft: DraftTransaction = { ...(session.draft as DraftTransaction) };
  if (!draft.mode) {
    return { handled: false as const };
  }

  switch (session.kind) {
    case "expense_missing":
      if (session.step === "note") {
        draft.note = titleCase(message);
        return continueExpenseDraft(context, request, session.originMessage, draft);
      }
      if (session.step === "date") {
        const parsedDate = parseDateInput(message);
        const error = applyDateValidationToDraft(draft, parsedDate);
        if (error) {
          return {
            handled: true as const,
            reply: error,
            success: false,
            context: withSession(context, session),
          };
        }
        return draft.mode === "expense"
          ? continueExpenseDraft(context, request, session.originMessage, draft)
          : continueIncomeDraft(context, request, session.originMessage, draft);
      }
      if (session.step === "income-category") {
        const match = FIXED_INCOME_CATEGORIES.find((item) => item.toLowerCase() === lower);
        if (!match) {
          return {
            handled: true as const,
            reply: "Please choose one of these: Salary, Gift, Investment Returns, or Others.",
            success: false,
            context: withSession(context, session),
          };
        }
        draft.incomeCategory = match;
        return continueIncomeDraft(context, request, session.originMessage, draft);
      }
      return { handled: false as const };
    case "choose_expense_category": {
      draft.category = titleCase(message);
      if (draft.category.toLowerCase() === "other") {
        draft.category = "Other";
        draft.categoryType = "Wants";
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        return finalizeExpense(context, request, draft);
      }

      const categories = await getUserCategories(request);
      const duplicate = findNearDuplicate(draft.category, "Wants", categories) || findNearDuplicate(draft.category, "Needs", categories);
      if (duplicate) {
        draft.category = duplicate.name;
        draft.categoryType = duplicate.type;
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        return finalizeExpense(context, request, draft);
      }

      draft.createCategory = true;
      draft.categoryType = "Wants";
      draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
      await createCategory({ name: draft.category, type: draft.categoryType }, { req: request });
      return maybeConfirmBulkMove(context, request, session, draft);
    }
    case "suggest_new_category": {
      draft.category = titleCase(message);
      draft.categoryType = session.parentType || "Wants";
      draft.createCategory = true;
      draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
      await createCategory({ name: draft.category, type: draft.categoryType }, { req: request });
      return maybeConfirmBulkMove(context, request, session, draft);
    }
    default:
      return { handled: false as const };
  }
}

async function resumeSessionFromAction(
  context: V2Context,
  request: Request,
  session: V2Session,
  details: any,
) {
  const actionId = details?.actionId;
  const value = details?.value;
  const selectedIds = details?.selectedIds as string[] | undefined;
  const draft: DraftTransaction = { ...(session.draft as DraftTransaction) };

  if (actionId === "cancel") {
    return {
      handled: true as const,
      reply: "Cancelled this draft. Nothing was saved.",
      success: false,
      context: clearSession(context),
    };
  }

  switch (session.kind) {
    case "confirm_amount_rounding":
      if (actionId === "confirm-rounded-amount") {
        draft.amount = draft.roundedAmount;
        draft.needsRoundingConfirmation = false;
        return draft.mode === "expense"
          ? continueExpenseDraft(context, request, session.originMessage, draft)
          : continueIncomeDraft(context, request, session.originMessage, draft);
      }
      break;
    case "expense_missing":
    case "income_missing":
      if (actionId === "today" || actionId === "yesterday" || value) {
        const parsedDate = parseDateInput(String(value || actionId));
        const error = applyDateValidationToDraft(draft, parsedDate);
        if (error) {
          return {
            handled: true as const,
            reply: error,
            success: false,
            context: withSession(context, session),
          };
        }
        return draft.mode === "expense"
          ? continueExpenseDraft(context, request, session.originMessage, draft)
          : continueIncomeDraft(context, request, session.originMessage, draft);
      }
      if (session.step === "income-category" && value) {
        draft.incomeCategory = value as IncomeCategory;
        return continueIncomeDraft(context, request, session.originMessage, draft);
      }
      break;
    case "confirm_ambiguous_date":
      if (actionId === "confirm-date") {
        draft.ambiguousDateInput = undefined;
        return draft.mode === "expense"
          ? continueExpenseDraft(context, request, session.originMessage, draft)
          : continueIncomeDraft(context, request, session.originMessage, draft);
      }
      if (actionId === "pick-date" && value) {
        const parsedDate = parseDateInput(value);
        const error = applyDateValidationToDraft(draft, parsedDate);
        if (error) {
          return {
            handled: true as const,
            reply: error,
            success: false,
            context: withSession(context, session),
          };
        }
        return draft.mode === "expense"
          ? continueExpenseDraft(context, request, session.originMessage, draft)
          : continueIncomeDraft(context, request, session.originMessage, draft);
      }
      break;
    case "confirm_old_date":
      if (actionId === "confirm-old-date") {
        draft.needsOldDateConfirmation = false;
        return draft.mode === "expense"
          ? continueExpenseDraft(context, request, session.originMessage, draft)
          : continueIncomeDraft(context, request, session.originMessage, draft);
      }
      break;
    case "choose_expense_category":
      if (value) {
        if (value === "Other") {
          draft.category = "Other";
          draft.categoryType = "Wants";
          draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
          return finalizeExpense(context, request, draft);
        }
        const categories = await getUserCategories(request);
        const selected = categories.find((category) => normalizeName(category.name) === normalizeName(value));
        if (selected) {
          draft.category = selected.name;
          draft.categoryType = selected.type;
          draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
          return finalizeExpense(context, request, draft);
        }
      }
      break;
    case "confirm_duplicate_category":
      if (actionId === "use-duplicate") {
        draft.category = session.duplicateName;
        draft.categoryType = session.parentType;
        draft.createCategory = false;
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        return finalizeExpense(context, request, draft);
      }
      if (actionId === "create-anyway") {
        draft.category = draft.suggestedCategory;
        draft.categoryType = session.parentType || "Wants";
        draft.createCategory = true;
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        await createCategory({ name: String(draft.category), type: draft.categoryType }, { req: request });
        return maybeConfirmBulkMove(context, request, session, draft);
      }
      if (actionId === "skip") {
        draft.category = "Other";
        draft.categoryType = "Wants";
        draft.createCategory = false;
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        return finalizeExpense(context, request, draft);
      }
      break;
    case "suggest_new_category":
      if (actionId === "use-suggested-category") {
        draft.category = draft.suggestedCategory;
        draft.categoryType = session.parentType || "Wants";
        draft.createCategory = true;
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        await createCategory({ name: String(draft.category), type: draft.categoryType }, { req: request });
        return maybeConfirmBulkMove(context, request, session, draft);
      }
      if (actionId === "skip") {
        draft.category = "Other";
        draft.categoryType = "Wants";
        draft.createCategory = false;
        draft.sanitizedNote = sanitizeFreeText(draft.note, 120);
        return finalizeExpense(context, request, draft);
      }
      break;
    case "confirm_bulk_move":
      if (actionId === "move-all") {
        for (const item of session.moveCandidates || []) {
          await updateExpense(
            item.id,
            { category: draft.categoryType, subcategory: draft.category },
            { req: request },
          );
        }
        return finalizeExpense(context, request, draft);
      }
      if (actionId === "skip") {
        return finalizeExpense(context, request, draft);
      }
      break;
    case "pick_bulk_move":
      if (actionId === "move-selected") {
        for (const id of selectedIds || []) {
          await updateExpense(
            id,
            { category: draft.categoryType, subcategory: draft.category },
            { req: request },
          );
        }
        return finalizeExpense(context, request, draft);
      }
      if (actionId === "skip") {
        return finalizeExpense(context, request, draft);
      }
      break;
    case "create_category_direct":
      if (actionId === "use-duplicate") {
        return {
          handled: true as const,
          reply: `Using your existing '${session.duplicateName}' category instead. No new category was created.`,
          success: true,
          context: clearSession(context),
        };
      }
      if (actionId === "create-anyway" && draft.category && draft.categoryType) {
        const response = await createCategory(
          { name: draft.category, type: draft.categoryType },
          { req: request },
        );
        return {
          handled: true as const,
          reply: `Created '${draft.category}' under ${draft.categoryType}.`,
          success: true,
          data: response?.category || response,
          context: clearSession(context),
        };
      }
      if (actionId === "skip") {
        return {
          handled: true as const,
          reply: "Skipped category creation.",
          success: false,
          context: clearSession(context),
        };
      }
      break;
    default:
      break;
  }

  return { handled: false as const };
}

async function handleDirectCategoryCreation(
  context: V2Context,
  request: Request,
  message: string,
) {
  const parsed = parseDirectCategoryRequest(message);
  if (!parsed) return { handled: false as const };

  const categories = await getUserCategories(request);
  const duplicate = findNearDuplicate(parsed.name, parsed.type, categories);
  if (duplicate) {
    const session: V2Session = {
      id: makeSessionId(),
      kind: "create_category_direct",
      createdAt: new Date().toISOString(),
      originMessage: message,
      duplicateName: duplicate.name,
      parentType: duplicate.type,
      draft: {
        mode: "expense",
        category: parsed.name,
        categoryType: parsed.type,
      },
    };
    return buildFollowUp(context, session, {
      kind: "choices",
      prompt: `You already have a '${duplicate.name}' category — use that instead?`,
      options: [
        { id: "use-duplicate", label: `Use ${duplicate.name}`, action: "submit", variant: "primary" },
        { id: "create-anyway", label: `Create ${parsed.name} anyway`, action: "submit", variant: "secondary" },
        { id: "skip", label: "Skip", action: "submit", variant: "secondary" },
        { id: "cancel", label: "Cancel", action: "cancel", variant: "danger" },
      ],
      allowTextInput: false,
    });
  }

  const response = await createCategory(
    { name: parsed.name, type: parsed.type },
    { req: request },
  );

  return {
    handled: true as const,
    reply: `Created '${parsed.name}' under ${parsed.type}.`,
    success: true,
    data: response?.category || response,
    context: clearSession(context),
  };
}

async function handleExpenseFlow(
  context: V2Context,
  request: Request,
  message: string,
) {
  const parsedAmount = parseAmount(message);
  if ("error" in parsedAmount) {
    if (parsedAmount.error === "negative") {
      return {
        handled: true as const,
        reply: "Amount can't be negative — how much did you spend?",
        success: false,
        context,
      };
    }
    if (parsedAmount.error === "zero") {
      return {
        handled: true as const,
        reply: "That amount is zero. If you still want to log it, please add it manually instead.",
        success: false,
        context,
      };
    }
    if (parsedAmount.error === "unparseable") {
      return {
        handled: true as const,
        reply: "I couldn't understand the amount. Please restate it with numbers.",
        success: false,
        context,
      };
    }
    return { handled: false as const };
  }

  const note = parseExpenseNote(message);
  const draft: DraftTransaction = {
    mode: "expense",
    amount: parsedAmount.amount,
    amountApproximate: parsedAmount.approximate,
    amountRaw: parsedAmount.raw,
    note,
  };

  if (parsedAmount.rounded) {
    draft.needsRoundingConfirmation = true;
    draft.roundedAmount = parsedAmount.amount;
  }

  const dateInMessage = message.match(/\b(today|yesterday|last\s+\w+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/i)?.[0];
  if (dateInMessage) {
    const parsedDate = parseDateInput(dateInMessage);
    const error = applyDateValidationToDraft(draft, parsedDate);
    if (error) {
      return {
        handled: true as const,
        reply: error,
        success: false,
        context,
      };
    }
  }

  return continueExpenseDraft(context, request, message, draft);
}

async function handleIncomeFlow(
  context: V2Context,
  request: Request,
  message: string,
) {
  const parsedAmount = parseAmount(message);
  if ("error" in parsedAmount) {
    if (parsedAmount.error === "negative") {
      return {
        handled: true as const,
        reply: "Amount can't be negative — how much income should I log?",
        success: false,
        context,
      };
    }
    if (parsedAmount.error === "zero") {
      return {
        handled: true as const,
        reply: "That amount is zero. Please confirm a non-zero income amount or cancel.",
        success: false,
        context,
      };
    }
    return { handled: false as const };
  }

  const note = sanitizeFreeText(
    message
      .replace(/₹/g, "")
      .replace(/-?\d[\d,]*(?:\.\d{1,4})?\s*(?:k|l|lakh)?/gi, "")
      .replace(/\b(today|yesterday|last\s+\w+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi, "")
      .replace(/\b(got|received|earned|salary|income|from|credit|credited)\b/gi, ""),
    120,
  );

  const draft: DraftTransaction = {
    mode: "income",
    amount: parsedAmount.amount,
    amountApproximate: parsedAmount.approximate,
    amountRaw: parsedAmount.raw,
    note: note ? titleCase(note) : "",
    incomeCategory: inferIncomeCategory(message),
  };

  if (parsedAmount.rounded) {
    draft.needsRoundingConfirmation = true;
    draft.roundedAmount = parsedAmount.amount;
  }

  const dateInMessage = message.match(/\b(today|yesterday|last\s+\w+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/i)?.[0];
  if (dateInMessage) {
    const parsedDate = parseDateInput(dateInMessage);
    const error = applyDateValidationToDraft(draft, parsedDate);
    if (error) {
      return {
        handled: true as const,
        reply: error,
        success: false,
        context,
      };
    }
  }

  return continueIncomeDraft(context, request, message, draft);
}

async function handleExpenseSummary(request: Request, message: string) {
  const range = parseRelativeRange(message);
  const response = await fetchExpenses(
    { fromDate: range.fromDate, toDate: range.toDate },
    { req: request },
  );
  const expenses = response?.expenses || [];

  if (!expenses.length) {
    return `You don't have any expenses logged for ${range.label} yet.`;
  }

  const total = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.subcategory || expense.category || "Other";
    byCategory.set(key, (byCategory.get(key) || 0) + Number(expense.amount));
  }

  const top = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => `${name} ${formatCurrency(amount)}`)
    .join(", ");

  return `Your total expenses for ${range.label} are ${formatCurrency(total)}. Top categories: ${top}.`;
}

async function handleIncomeSummary(request: Request, message: string) {
  const range = parseRelativeRange(message);
  const response = await fetchIncome(
    { fromDate: range.fromDate, toDate: range.toDate },
    { req: request },
  );
  const incomes = response?.incomes || [];

  if (!incomes.length) {
    return `You don't have any income logged for ${range.label} yet.`;
  }

  const total = incomes.reduce((sum: number, income: any) => sum + Number(income.amount), 0);
  const topSources = [...new Set(incomes.map((income: any) => income.source))]
    .slice(0, 3)
    .join(", ");

  return `Your total income for ${range.label} is ${formatCurrency(total)}. Recent sources: ${topSources}.`;
}

async function handleBudgetUpdate(context: V2Context, request: Request, message: string): Promise<V2Result> {
  const parsedAmount = parseAmount(message);
  if ("error" in parsedAmount) {
    const reply =
      parsedAmount.error === "negative"
        ? "Budget amount can't be negative. Please enter a positive monthly budget."
        : parsedAmount.error === "zero"
          ? "Budget amount can't be zero. Please enter a positive monthly budget or cancel."
          : "I couldn't find a valid budget amount. Try: Set my monthly budget to ₹20,000.";

    return {
      handled: true,
      reply,
      success: false,
      context: clearSession(context),
    };
  }

  const month = format(new Date(), "yyyy-MM");
  const limit = parsedAmount.amount;
  const response = await updateBudget({ month, limit }, { req: request });

  return {
    handled: true,
    reply: `Updated your monthly budget for ${month} to ${formatCurrency(limit)}.`,
    success: true,
    eventType: "budgetUpdated",
    data: response?.budget || { limit, month },
    context: clearSession(context),
  };
}

async function handleSavingsInsights(request: Request, message: string) {
  const now = new Date();
  const month = format(now, "yyyy-MM");
  const [budgetResponse, expenseResponse, incomeResponse] = await Promise.all([
    fetchBudget(month, { req: request }).catch(() => ({ limit: 0 })),
    fetchExpenses(
      {
        fromDate: format(startOfMonth(now), "yyyy-MM-dd"),
        toDate: format(endOfMonth(now), "yyyy-MM-dd"),
      },
      { req: request },
    ),
    fetchIncome(
      {
        fromDate: format(startOfMonth(now), "yyyy-MM-dd"),
        toDate: format(endOfMonth(now), "yyyy-MM-dd"),
      },
      { req: request },
    ),
  ]);

  const expenses = expenseResponse?.expenses || [];
  const incomes = incomeResponse?.incomes || [];
  if (!expenses.length && !incomes.length) {
    return "You don't have enough data yet for savings advice. Add a few expenses or income entries and I can analyze them.";
  }

  const totalSpent = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
  const totalIncome = incomes.reduce((sum: number, income: any) => sum + Number(income.amount), 0);
  const budgetLimit = Number(budgetResponse?.limit || 0);

  if (!budgetLimit) {
    if (!totalIncome) {
      return `You've spent ${formatCurrency(totalSpent)} this month. Enable Budget Mode to get goal-based savings advice.`;
    }
    const savings = totalIncome - totalSpent;
    return `This month you've earned ${formatCurrency(totalIncome)} and spent ${formatCurrency(totalSpent)}, leaving ${formatCurrency(savings)}. Your biggest opportunity is to cut back in your top discretionary categories.`;
  }

  const remaining = budgetLimit - totalSpent;
  const usage = budgetLimit ? (totalSpent / budgetLimit) * 100 : 0;
  const tone =
    usage >= 100
      ? "You've crossed your monthly budget."
      : usage >= 85
        ? "You're getting close to your monthly budget."
        : "You're still within your budget.";

  return `${tone} Budget: ${formatCurrency(budgetLimit)}. Spent: ${formatCurrency(totalSpent)}. Remaining: ${formatCurrency(remaining)}. ${remaining > 0 ? `Try keeping your daily average near ${formatCurrency(remaining / Math.max(1, endOfMonth(now).getDate() - now.getDate()))}.` : "Focus on slowing spending in your highest categories for the rest of the month."}`;
}

export async function handleChatV2(envelope: RequestEnvelope): Promise<V2Result> {
  const { body, request } = envelope;
  const message = body?.message?.toString().trim() || "";
  const context = (body?.context || {}) as V2Context;
  const activeSession = context?.v2?.session || null;

  if (message && isCrossUserDataRequest(message)) {
    return {
      handled: true,
      reply: "I can only help with financial data from your authenticated SpendWise account. I can't access or show another user's records.",
      success: false,
      context: clearSession(context),
    };
  }

  if (body?.intentType === "v2_followup" && activeSession) {
    const resumed = await resumeSessionFromAction(context, request, activeSession, body.details || {});
    if (resumed.handled) return resumed;
  }

  if (body?.intentType === "v2_followup" && !activeSession) {
    return {
      handled: true,
      reply: "That action has expired. Please start a new request.",
      success: false,
      context: clearSession(context),
    };
  }

  if (message && activeSession) {
    const resumed = await resumeSessionFromMessage(context, request, activeSession, message);
    if (resumed.handled) return resumed;
  }

  if (!message) {
    return { handled: false };
  }

  if (isDirectCategoryCreation(message)) {
    return handleDirectCategoryCreation(clearSession(context), request, message);
  }

  if (isExpenseMessage(message)) {
    return handleExpenseFlow(clearSession(context), request, message);
  }

  if (isIncomeMessage(message)) {
    return handleIncomeFlow(clearSession(context), request, message);
  }

  if (isBudgetUpdateMessage(message)) {
    return handleBudgetUpdate(clearSession(context), request, message);
  }

  if (isExpenseSummaryQuery(message)) {
    return {
      handled: true,
      reply: await handleExpenseSummary(request, message),
      success: true,
      context: clearSession(context),
    };
  }

  if (isIncomeSummaryQuery(message)) {
    return {
      handled: true,
      reply: await handleIncomeSummary(request, message),
      success: true,
      context: clearSession(context),
    };
  }

  if (isSavingsQuery(message)) {
    return {
      handled: true,
      reply: await handleSavingsInsights(request, message),
      success: true,
      context: clearSession(context),
    };
  }

  return { handled: false };
}
