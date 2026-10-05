/**
 * Input validation + missing-field recovery for the Sage batch pipeline.
 *
 * Every batch the extractor produces is screened here before it reaches the
 * database. Anything the user did not actually tell us stays unresolved, and an
 * unresolved field means **nothing is written** — Sage asks, the user answers,
 * and only a fully resolved batch is persisted. There is no partial write and
 * no silent defaulting, which is the behaviour this module replaces:
 * "spent 500 on groceries" used to land in the books with an invented date.
 *
 * Missing fields are collected across the whole batch before the first prompt,
 * so a three-transaction message missing a date and a category announces both
 * up front instead of drip-feeding one question at a time.
 *
 * Sessions are stateless on the server: the draft rides back to the client on
 * `context.validation.session` and is handed back on the follow-up call, the
 * same ephemeral pattern the rest of the chat pipeline already uses.
 */

import { prisma } from "@/lib/prisma";
import { matchCategoryFromText } from "../categories";
import { executeOperationsBatch } from "./batch-executor";
import {
  detectDateInMessage,
  isSettableDate,
  todayString,
  yesterdayString,
} from "./date-detection";
import type { IncomeSource, OperationKind, ParsedOperation } from "./batch-extractor";

export type MissingField = "date" | "category" | "source";

export type ValidationStep =
  | "collect_date"
  | "collect_category"
  | "collect_source"
  | "collect_custom_subcategory"
  | "confirm_budget_mode";

/** A batch operation held mid-flight while Sage collects missing fields. */
export interface DraftOperation {
  kind: OperationKind;
  amount: number;
  category: "Needs" | "Wants" | null;
  subcategory: string | null;
  source: IncomeSource | null;
  note: string;
  date: string | null;
}

export interface ValidationSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  /**
   * Owning user. Carried on the session so an in-flight draft can never be
   * completed by a different authenticated user — the client hands this
   * payload straight back, so the recorded owner is re-checked on every
   * follow-up rather than trusted.
   */
  userId: string;
  originMessage: string;
  operations: DraftOperation[];
  /** Every field still missing across the whole batch, in prompt order. */
  missing: MissingField[];
  step: ValidationStep;
  /** Budget payload held while the free/budget-mode decision is pending. */
  budget?: { amount: number; month: string };
}

export interface ValidationOutcome {
  handled: true;
  /** `prompt` = still collecting, `executed` = written, `cancelled` = abandoned. */
  status: "prompt" | "executed" | "cancelled";
  reply: string;
  success: boolean;
  eventType?: "expenseAdded" | "incomeAdded" | "budgetUpdated" | "batchTransactionsAdded";
  data?: any;
  followUp?: { type: string; payload: any };
  context?: any;
}

/**
 * Request `intentType` that routes a prompt answer back into this module, and
 * the `followUp.type` it answers with. One string on both sides so the client
 * can recognise its own prompt: the client cannot import this module (it pulls
 * in prisma), so `components/chat/ChatPanel.tsx` restates this literal.
 */
export const VALIDATION_INTENT = "validation_followup";
export const VALIDATION_FOLLOW_UP_TYPE = VALIDATION_INTENT;

const SESSION_TTL_MS = 15 * 60 * 1000;
const SUGGESTION_LIMIT = 6;
const HISTORY_SAMPLE = 500;

const INCOME_SOURCES: IncomeSource[] = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Others",
];

/** Prompts run in this order so the cheapest, most common field is asked first. */
const FIELD_ORDER: MissingField[] = ["date", "category", "source"];

const FIELD_LABEL: Record<MissingField, { one: string; many: string; article: string }> = {
  date: { one: "date", many: "dates", article: "the date" },
  category: { one: "category", many: "categories", article: "the category" },
  source: { one: "income source", many: "income sources", article: "the income source" },
};

const EXPENSE_HISTORY_LINK = "/expenses";
const INCOME_HISTORY_LINK = "/income";
// The budget limit and the Free/Budget mode switch both live on the dashboard,
// so that is where a budget change is actually reviewed.
const BUDGET_LINK = "/dashboard";

// ── Formatting helpers ───────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Renders a YYYY-MM-DD string as "15 Aug 2023" without pulling in date-fns. */
export function formatFriendlyDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

/** "date", "date and category", "date, category and source". */
function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function describeMissing(missing: MissingField[]): string {
  const labels = missing.map((field) => FIELD_LABEL[field].one);
  const verb = missing.length > 1 ? "are" : "is";
  return `${joinWithAnd(labels)} ${verb} missing — please select ${joinWithAnd(
    missing.map((field) => FIELD_LABEL[field].article),
  )}`;
}

// ── Session lifecycle ────────────────────────────────────────────────────

function createSession(
  userId: string,
  originMessage: string,
  operations: DraftOperation[],
  step: ValidationStep,
  budget?: { amount: number; month: string },
): ValidationSession {
  const now = Date.now();
  return {
    id: `val-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    userId,
    originMessage,
    operations,
    missing: collectMissing(operations),
    step,
    budget,
  };
}

export function isSessionExpired(session: ValidationSession): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

/**
 * Every unresolved field across the batch, de-duplicated and ordered. Runs on
 * each fill, so it doubles as the "is this batch safe to write?" gate — an
 * empty result is the only thing that authorises persistence.
 */
export function collectMissing(operations: DraftOperation[]): MissingField[] {
  const found = new Set<MissingField>();

  for (const op of operations) {
    if (op.kind === "EXPENSE" || op.kind === "INCOME") {
      if (!op.date) found.add("date");
    }
    if (op.kind === "EXPENSE" && (!op.subcategory || !op.category)) {
      found.add("category");
    }
    if (op.kind === "INCOME" && !op.source) found.add("source");
  }

  return FIELD_ORDER.filter((field) => found.has(field));
}

// ── Draft construction ───────────────────────────────────────────────────

/**
 * Projects validated extractor output into a draft.
 *
 * The date is resolved from the user's own words via `detectDateInMessage`
 * rather than from the model's `date` field: a model handed "Today's date is X"
 * will happily invent a date, and that invention is precisely what used to slip
 * past validation. The model's date is only trusted when the user actually
 * mentioned one, and even then ours wins so relative phrases resolve correctly.
 */
export function toDraftOperations(
  operations: ParsedOperation[],
  originMessage: string,
): DraftOperation[] {
  // Resolved once so every operation in the batch agrees on the date even if
  // the message happens to straddle midnight.
  const detected = detectDateInMessage(originMessage);
  // When the user named a date, it applies to the whole message — "500 on
  // groceries, 200 on transport on 2023-08-15" means both land that day.
  const statedDate = detected.found && detected.date ? detected.date : null;

  return operations.map((op) => {
    const note = (op.note || op.subcategory || "").toString().trim();
    // With no date in the user's own words, the model's date is discarded
    // outright rather than trusted: a model told "today's date is X" will
    // manufacture a date, and accepting that invention is the exact bug this
    // gate exists to stop.
    const date = statedDate;

    if (op.kind === "EXPENSE") {
      return {
        kind: "EXPENSE",
        amount: op.amount,
        category: op.category ?? null,
        subcategory: op.subcategory ?? null,
        source: null,
        note,
        date,
      };
    }

    if (op.kind === "INCOME") {
      return {
        kind: "INCOME",
        amount: op.amount,
        category: null,
        subcategory: null,
        source: op.source ?? null,
        note,
        date,
      };
    }

    return {
      kind: "BUDGET_UPDATE",
      amount: op.amount,
      category: null,
      subcategory: null,
      source: null,
      note,
      date,
    };
  });
}

// ── Category suggestions from the user's own history ─────────────────────

interface UserCategoryRow {
  name: string;
  type: string;
}

/**
 * Ranks the user's real categories against the note they used, so the buttons
 * Sage offers are the ones they have actually spent against before. Falls back
 * to their full category list, then to "Other", rather than inventing options.
 */
export async function suggestCategories(
  userId: string,
  note: string,
  explicitNames: string[] = [],
): Promise<string[]> {
  const categories = (await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: { name: true, type: true },
  })) as UserCategoryRow[];

  const known = categories.map((c) => c.name).filter(Boolean);
  const ranked = new Map<string, number>();
  const bump = (name: string, score: number) => {
    const key = name.toLowerCase();
    ranked.set(key, Math.max(ranked.get(key) || 0, score));
  };

  // 1. What the user actually logs most often — the strongest signal.
  let frequent: Array<{ subcategory: string | null }> = [];
  try {
    frequent = (await prisma.expense.findMany({
      where: { userId },
      select: { subcategory: true },
      orderBy: { date: "desc" },
      take: HISTORY_SAMPLE,
    })) as Array<{ subcategory: string | null }>;
  } catch {
    // History is a ranking hint, never a hard dependency — an unreadable
    // history must not block the prompt from being shown.
    frequent = [];
  }

  const tally = new Map<string, number>();
  for (const row of frequent) {
    const name = row.subcategory?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    tally.set(key, (tally.get(key) || 0) + 1);
  }

  const maxTally = Math.max(1, ...tally.values());
  for (const [key, count] of tally) {
    // 0.40 (rare) .. 0.75 (most used) — always below a direct text match.
    bump(originalName(frequent, key), 0.4 + (count / maxTally) * 0.35);
  }

  // 2. Direct keyword match against what the user typed.
  for (const scored of scoreAgainst(note, known)) {
    bump(scored, 0.9);
  }

  // 3. Anything the model already proposed ranks high.
  for (const name of explicitNames) {
    if (name?.trim()) bump(name.trim(), 0.95);
  }

  const rankedNames = [...ranked.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => originalName(frequent, key) || key);

  // Preserve the user's own casing from the category table when available.
  const resolved = rankedNames.map(
    (name) =>
      known.find((k) => k.toLowerCase() === name.toLowerCase()) || name,
  );

  if (!resolved.some((n) => n.toLowerCase() === "other")) {
    resolved.push("Other");
  }

  return dedupe(resolved).slice(0, SUGGESTION_LIMIT);
}

function originalName(rows: Array<{ subcategory: string | null }>, lowerKey: string) {
  return rows.find((r) => r.subcategory?.toLowerCase() === lowerKey)?.subcategory || "";
}

function scoreAgainst(note: string, known: string[]): string[] {
  const lowered = note.toLowerCase();
  if (!lowered) return [];
  const direct = known.filter((name) => lowered.includes(name.toLowerCase()));
  if (direct.length) return direct;

  const scored = matchCategoryFromText(note, known.map((name) => ({
    name,
    type: "Needs",
  })));
  return scored ? [scored.name] : [];
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Resolves the Needs/Wants parent for a chosen subcategory name. */
async function resolveParentType(
  userId: string,
  subcategory: string,
  note: string,
): Promise<"Needs" | "Wants"> {
  const categories = (await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: { name: true, type: true },
  })) as UserCategoryRow[];

  const matched = matchCategoryFromText(
    subcategory,
    categories.map((c) => ({ name: c.name, type: c.type })),
  ) || matchCategoryFromText(note, categories.map((c) => ({ name: c.name, type: c.type })));

  return matched?.type === "Wants" ? "Wants" : "Needs";
}

// ── Reply composition ────────────────────────────────────────────────────

function budgetMonthFrom(date: string | null): string {
  if (date && /^\d{4}-\d{2}/.test(date)) return date.slice(0, 7);
  return todayString().slice(0, 7);
}

/** Announced up front so the user knows how many steps they are looking at. */
function missingHeadline(session: ValidationSession): string {
  return describeMissing(session.missing);
}

function datePromptReply(session: ValidationSession): string {
  const count = session.operations.filter(
    (op) => op.kind !== "BUDGET_UPDATE" && !op.date,
  ).length;

  return [
    `📅 **${missingHeadline(session)}**`,
    "",
    "I couldn't spot a date in your message, so I need one before I can save" +
      (count > 1 ? ` all ${count} transactions.` : " this transaction."),
    "",
    "• Tap **Today** or **Yesterday** for the quickest option",
    "• Or pick any other date from the calendar",
    "",
    "You can skip this step if you'd rather start again.",
  ].join("\n");
}

function categoryPromptReply(session: ValidationSession, options: string[]): string {
  const targets = session.operations.filter(
    (op) => op.kind === "EXPENSE" && (!op.subcategory || !op.category),
  );
  const first = targets[0];

  const detail = first
    ? `The ${formatCurrency(first.amount)}${first.note ? ` ${first.note.toLowerCase()}` : " transaction"} is missing a category.`
    : "One of the transactions is missing a category.";

  return [
    `🏷️ **${missingHeadline(session)}**`,
    "",
    detail,
    "These are the categories you use most — pick the closest one.",
    "",
    `Choose **Other** or **✏️ Custom** to enter your own subcategory instead.`,
    "",
    options.length ? `Options: ${options.join(", ")}` : "",
    "",
    "You can skip this step if you'd rather start again.",
  ]
    .filter(Boolean)
    .join("\n");
}

function sourcePromptReply(session: ValidationSession): string {
  return [
    `💰 **${missingHeadline(session)}**`,
    "",
    "I couldn't tell where this income came from, so pick the source that matches.",
    "",
    `Options: ${INCOME_SOURCES.join(", ")}`,
    "",
    "You can skip this step if you'd rather start again.",
  ].join("\n");
}

function customSubcategoryPromptReply(session: ValidationSession): string {
  const target = session.operations.find(
    (op) => op.kind === "EXPENSE" && !op.subcategory,
  );
  const detail = target
    ? `Type the subcategory to use for the ${formatCurrency(target.amount)}${
        target.note ? ` ${target.note.toLowerCase()}` : ""
      } transaction.`
    : "Type the subcategory you'd like to save it under.";

  return [
    "✏️ **Let's create a custom category**",
    "",
    detail,
    "",
    "Enter a name below, then tap **Save**. You can skip this step and start again instead.",
  ].join("\n");
}

function budgetModePromptReply(session: ValidationSession): string {
  const amount = formatCurrency(session.budget?.amount ?? 0);

  return [
    "💡 **You're currently in Free mode**",
    "",
    "Free mode means there's no monthly spending limit in place, so a budget wouldn't cap anything yet. Switching to **Budget mode** turns on the limit, and I'll save your budget as **" +
      amount +
      "** at the same time.",
    "",
    "**Can I change to Budget mode and update your budget?**",
    "",
    "• **Yes** — switch to Budget mode and update the budget",
    "• **No** — keep Free mode and leave everything unchanged",
    "",
    "You can skip this if you change your mind.",
  ].join("\n");
}

const CANCEL_REPLY = [
  "🚫 **Transaction cancelled by you..!**",
  "",
  "Nothing was saved, so your records are exactly as they were.",
  "",
  "How can I help you with your finances today?",
].join("\n");

function buildSuccessReply(operations: DraftOperation[]): string {
  const expenses = operations.filter((op) => op.kind === "EXPENSE");
  const incomes = operations.filter((op) => op.kind === "INCOME");
  const budgets = operations.filter((op) => op.kind === "BUDGET_UPDATE");

  const lines: string[] = [];
  const total = expenses.reduce((sum, op) => sum + op.amount, 0);
  const incomeTotal = incomes.reduce((sum, op) => sum + op.amount, 0);

  const headline: string[] = [];
  if (expenses.length) {
    headline.push(
      `${expenses.length} expense${expenses.length > 1 ? "s" : ""} of ${formatCurrency(total)}`,
    );
  }
  if (incomes.length) {
    headline.push(
      `${incomes.length} income${incomes.length > 1 ? "s" : ""} of ${formatCurrency(incomeTotal)}`,
    );
  }
  if (budgets.length) {
    headline.push(`a monthly budget of ${formatCurrency(budgets[0].amount)}`);
  }

  lines.push(
    `✅ **Your transaction has been recorded successfully** — ${joinWithAnd(headline)}.`,
  );

  const details = operations
    .filter((op) => op.kind !== "BUDGET_UPDATE")
    .map((op) => {
      const label = op.kind === "EXPENSE" ? op.subcategory : op.source;
      return `• ${label || "Other"} · ${formatCurrency(op.amount)}${
        op.date ? ` · ${formatFriendlyDate(op.date)}` : ""
      }`;
    });
  if (details.length) {
    lines.push("");
    lines.push(...details);
  }

  if (expenses.length || incomes.length) {
    // Each kind gets its own history. Pointing an income confirmation at the
    // expense history sent the user somewhere that cannot show the entry they
    // had just added.
    const targets: string[] = [];
    if (expenses.length) targets.push(`[expense history](${EXPENSE_HISTORY_LINK})`);
    if (incomes.length) targets.push(`[income history](${INCOME_HISTORY_LINK})`);
    lines.push("");
    lines.push(`For more details, check your ${joinWithAnd(targets)}.`);
  } else if (budgets.length) {
    lines.push("");
    lines.push(
      `You can review or change it any time on your [dashboard](${BUDGET_LINK}).`,
    );
  }

  return lines.join("\n");
}

// ── Follow-up payload construction ───────────────────────────────────────

/**
 * True when an action id was emitted by this prompt family.
 *
 * Choice ids carry their value — "pick-category:Food", "pick-source:Salary" —
 * so the prefix identifies the action. Comparing the whole string against
 * "pick-category" matched nothing and left the user in a prompt loop, clicking
 * a category that was then rejected and re-offered forever.
 */
function isActionFor(actionId: string, prefix: string): boolean {
  if (!actionId) return false;
  return actionId === prefix || actionId.startsWith(`${prefix}:`);
}

function skipOption() {
  return {
    id: "skip",
    label: "Skip / Cancel",
    action: "cancel" as const,
    variant: "danger" as const,
  };
}

async function buildPrompt(
  session: ValidationSession,
  userId: string,
): Promise<{ reply: string; payload: any }> {
  if (session.step === "collect_date") {
    const today = todayString();
    return {
      reply: datePromptReply(session),
      payload: {
        ui: "v2",
        kind: "date",
        sessionId: session.id,
        prompt: missingHeadline(session),
        helperText: "Select a date to continue.",
        options: [
          { id: "pick-today", label: "Today", action: "submit", value: today, variant: "primary" },
          {
            id: "pick-yesterday",
            label: "Yesterday",
            action: "submit",
            value: yesterdayString(),
            variant: "secondary",
          },
          skipOption(),
        ],
        allowDateInput: true,
        maxDate: today,
      },
    };
  }

  if (session.step === "collect_category") {
    const target = session.operations.find(
      (op) => op.kind === "EXPENSE" && (!op.subcategory || !op.category),
    );
    const options = await suggestCategories(
      userId,
      target?.note || "",
      target?.subcategory ? [target.subcategory] : [],
    );

    return {
      reply: categoryPromptReply(session, options),
      payload: {
        ui: "v2",
        kind: "choices",
        sessionId: session.id,
        prompt: missingHeadline(session),
        helperText: target
          ? `For the ${formatCurrency(target.amount)} transaction${target.note ? ` (${target.note})` : ""}.`
          : undefined,
        options: [
          ...options.map((name, index) => ({
            id: `pick-category:${name}`,
            label: name,
            action: "submit" as const,
            value: name,
            variant: index === 0 ? ("primary" as const) : ("secondary" as const),
          })),
          {
            id: "pick-custom-category",
            label: "✏️ Custom subcategory",
            action: "submit" as const,
            variant: "secondary" as const,
          },
          skipOption(),
        ],
        allowTextInput: true,
        customTextActionId: "custom-subcategory",
        textInputPlaceholder: "Or type a custom subcategory…",
      },
    };
  }

  if (session.step === "collect_custom_subcategory") {
    return {
      reply: customSubcategoryPromptReply(session),
      payload: {
        ui: "v2",
        kind: "choices",
        sessionId: session.id,
        prompt: "Enter a custom subcategory",
        helperText: "Type a name and tap Save.",
        options: [skipOption()],
        allowTextInput: true,
        customTextActionId: "custom-subcategory",
        textInputPlaceholder: "e.g. Coffee, Pet care, Subscriptions…",
      },
    };
  }

  if (session.step === "collect_source") {
    return {
      reply: sourcePromptReply(session),
      payload: {
        ui: "v2",
        kind: "choices",
        sessionId: session.id,
        prompt: missingHeadline(session),
        helperText: "Pick where this income came from.",
        options: [
          ...INCOME_SOURCES.map((source, index) => ({
            id: `pick-source:${source}`,
            label: source,
            action: "submit" as const,
            value: source,
            variant: index === 0 ? ("primary" as const) : ("secondary" as const),
          })),
          skipOption(),
        ],
      },
    };
  }

  const amount = formatCurrency(session.budget?.amount ?? 0);
  return {
    reply: budgetModePromptReply(session),
    payload: {
      ui: "v2",
      kind: "confirm",
      sessionId: session.id,
      prompt: "You're currently in Free mode",
      helperText: `Switch to Budget mode and update your budget to ${amount}?`,
      options: [
        {
          id: "budget-mode-confirm",
          label: "Yes, switch & update",
          action: "submit" as const,
          value: "yes",
          variant: "primary" as const,
        },
        {
          id: "budget-mode-decline",
          label: "No, keep Free mode",
          action: "submit" as const,
          value: "no",
          variant: "secondary" as const,
        },
        skipOption(),
      ],
    },
  };
}

// ── Execution ────────────────────────────────────────────────────────────

function nextStep(missing: MissingField[]): ValidationStep | null {
  if (missing.includes("date")) return "collect_date";
  if (missing.includes("category")) return "collect_category";
  if (missing.includes("source")) return "collect_source";
  return null;
}

/**
 * Persists a fully resolved batch. The gate is explicit — an unresolved field
 * returns `prompt` and never reaches the executor.
 */
async function executeSession(
  session: ValidationSession,
  approvedBudgetMode: boolean,
): Promise<ValidationOutcome> {
  const missing = collectMissing(session.operations);
  if (missing.length > 0) {
    session.missing = missing;
    session.step = nextStep(missing)!;
    return promptOutcome(session, session.userId);
  }

  const operations: ParsedOperation[] = session.operations.map((op) => ({
    kind: op.kind,
    amount: op.amount,
    category: op.category ?? undefined,
    subcategory: op.subcategory ?? undefined,
    source: op.source ?? undefined,
    note: op.note || undefined,
    date: op.date ?? undefined,
  }));

  // The rich, validated reply is composed here rather than by the executor so
  // every write that went through this module reads the same way.
  const successReply = buildSuccessReply(session.operations);

  const result = await executeOperationsBatch(
    session.userId,
    operations,
    successReply,
    { approvedBudgetMode },
  );

  return {
    handled: true,
    status: "executed",
    // The composed reply wins: it is the one that names the resolved date and
    // category and links back to the history. The executor's own text is only
    // a fallback for the rare case where nothing was composed.
    reply: successReply || result.reply,
    success: true,
    eventType: result.eventType,
    data: result.data,
  };
}

async function promptOutcome(
  session: ValidationSession,
  userId: string,
): Promise<ValidationOutcome> {
  const { reply, payload } = await buildPrompt(session, userId);
  return {
    handled: true,
    status: "prompt",
    reply,
    success: false,
    followUp: { type: VALIDATION_FOLLOW_UP_TYPE, payload },
    context: { validation: { session } },
  };
}

function cancelOutcome(): ValidationOutcome {
  return {
    handled: true,
    status: "cancelled",
    reply: CANCEL_REPLY,
    success: false,
    context: { validation: { session: null } },
  };
}

/**
 * Entry point for a freshly extracted batch.
 *
 * Two things happen before anything is written: a budget change is gated on the
 * user being in budget mode (or having just approved the switch), and every
 * field the user never supplied is turned into a prompt. Returns `executed`
 * only when there was nothing to ask.
 */
export async function startValidation(
  userId: string,
  operations: ParsedOperation[],
  originMessage: string,
): Promise<ValidationOutcome> {
  const drafts = toDraftOperations(operations, originMessage);
  if (!drafts.length) {
    return { handled: true, status: "executed", reply: "", success: true };
  }

  const budgetOp = drafts.find((op) => op.kind === "BUDGET_UPDATE");
  if (budgetOp) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { expenseMode: true, monthlyLimit: true },
    });
    const alreadyInBudgetMode = user?.expenseMode === "limit";

    if (!alreadyInBudgetMode) {
      const session = createSession(
        userId,
        originMessage,
        drafts,
        "confirm_budget_mode",
        { amount: budgetOp.amount, month: budgetMonthFrom(budgetOp.date) },
      );
      return promptOutcome(session, userId);
    }
  }

  const session = createSession(userId, originMessage, drafts, "collect_date");
  session.missing = collectMissing(drafts);
  const firstStep = nextStep(session.missing);

  // Nothing to ask — the user gave us everything.
  if (!firstStep) {
    return executeSession(session, false);
  }

  session.step = firstStep;
  return promptOutcome(session, userId);
}

// ── Follow-up handling ───────────────────────────────────────────────────

/** Applies a value to every draft operation still waiting on that field. */
function applyDate(session: ValidationSession, date: string) {
  for (const op of session.operations) {
    if (op.kind !== "BUDGET_UPDATE" && !op.date) op.date = date;
  }
}

async function applyCategory(
  session: ValidationSession,
  userId: string,
  name: string,
): Promise<void> {
  const targets = session.operations.filter(
    (op) => op.kind === "EXPENSE" && (!op.subcategory || !op.category),
  );
  const firstNote = targets[0]?.note || "";
  const parentType = await resolveParentType(userId, name, firstNote);
  for (const op of targets) {
    op.subcategory = name;
    op.category = parentType;
  }
}

function applySource(session: ValidationSession, source: string) {
  for (const op of session.operations) {
    if (op.kind === "INCOME" && !op.source) op.source = source as IncomeSource;
  }
}

/**
 * Advances a session by one field.
 *
 * `skip` abandons the whole draft — a partially answered batch is never
 * written, which is why the cancel path does not attempt to reuse whatever the
 * user did supply.
 */
export async function handleValidationFollowUp(
  userId: string,
  session: ValidationSession,
  actionId: string,
  value?: string,
): Promise<ValidationOutcome> {
  if (!session || isSessionExpired(session) || session.userId !== userId) {
    // An expired session and a session owned by someone else are handled the
    // same way: refuse and write nothing. The route already filters ownership
    // via readValidationSession, but this module is the last gate before the
    // executor and must not depend on its caller having done that.
    return {
      handled: true,
      status: "cancelled",
      reply: [
        "⏳ **This request timed out** so I stopped where we were — nothing was saved.",
        "",
        "How can I help you with your finances today?",
      ].join("\n"),
      success: false,
      context: { validation: { session: null } },
    };
  }

  if (actionId === "skip") {
    return cancelOutcome();
  }

  if (session.step === "confirm_budget_mode") {
    if (actionId === "budget-mode-confirm") {
      const approved = (value ?? "yes") === "yes";
      if (!approved) {
        return {
          ...cancelOutcome(),
          reply: [
            "👍 **No problem** — I've left everything exactly as it was.",
            "",
            "Your spending is still being tracked, and you can set a budget any time with a message like \"set my monthly budget to 25000\".",
            "",
            "How can I help you with your finances today?",
          ].join("\n"),
        };
      }
      // Switching into budget mode clears any remaining missing fields: the
      // budget itself is the whole request, so nothing else needs asking.
      for (const op of session.operations) {
        if (op.kind === "BUDGET_UPDATE") op.note = op.note || "Monthly budget";
      }
      const outcome = await executeSession(session, true);
      return outcome.status === "executed"
        ? {
            ...outcome,
            // Replaces the composed reply, so it has to carry the link itself —
            // otherwise approving the mode is the one budget path that ends
            // with no way through to the budget.
            reply: [
              `💰 **You're now in Budget mode** — your monthly budget is set to ${formatCurrency(
                session.budget?.amount ?? 0,
              )}. Sage will keep an eye on your spending against it from now on.`,
              "",
              `You can review or change it any time on your [dashboard](${BUDGET_LINK}).`,
            ].join("\n"),
          }
        : outcome;
    }
    // Any other action on the mode question is treated as a decline.
    return cancelOutcome();
  }

  if (session.step === "collect_date") {
    // No value at all is not permission to guess. The Today/Yesterday buttons
    // send an explicit date; anything else that arrives without one re-asks.
    if (!value || !isSettableDate(value)) {
      return promptOutcome(session, userId);
    }
    applyDate(session, value);
  } else if (session.step === "collect_category") {
    if (actionId === "pick-custom-category") {
      session.step = "collect_custom_subcategory";
      session.missing = collectMissing(session.operations);
      return promptOutcome(session, userId);
    }
// Only an action this prompt actually offered may answer it. Without this
    // guard a stale or mismatched action would be filed verbatim as the
    // category - a date landing in the subcategory field, for instance.
    // The option ids are parameterised ("pick-category:Food"), so the prefix is
    // what identifies the action, not an exact string match.
    if (!isActionFor(actionId, "pick-category")) {
      return promptOutcome(session, userId);
    }
    const chosen = (value || "").trim();
    if (!chosen) return promptOutcome(session, userId);
    await applyCategory(session, userId, chosen);
  } else if (session.step === "collect_custom_subcategory") {
    const typed = (value || "").trim();
    // The free-text field posts this step's own action id, so a mismatch here
    // is as stale as a mismatched button and is refused the same way.
    if (actionId !== "custom-subcategory" || !typed) {
      return promptOutcome(session, userId);
    }
    await applyCategory(session, userId, typed);
  } else if (session.step === "collect_source") {
    const chosen = (value || "").trim();
    if (!isActionFor(actionId, "pick-source") || !INCOME_SOURCES.includes(chosen as IncomeSource)) {
      return promptOutcome(session, userId);
    }
    applySource(session, chosen);
  }

  session.missing = collectMissing(session.operations);
  const next = nextStep(session.missing);

  if (!next) {
    return executeSession(session, false);
  }

  session.step = next;
  return promptOutcome(session, userId);
}

/**
 * Reads a round-tripped session off the request context.
 *
 * The client hands this payload straight back, so it is untrusted input. A
 * session is only honoured when its recorded owner is the authenticated user —
 * otherwise another account could finish someone else's draft and spend their
 * draft contents into their own ledger.
 */
export function readValidationSession(
  context: any,
  userId: string,
): ValidationSession | null {
  const session = context?.validation?.session;
  if (!session || typeof session !== "object" || !Array.isArray(session.operations)) {
    return null;
  }
  if (session.userId && session.userId !== userId) {
    return null;
  }
  // Re-bind rather than trust: the id is only ever minted server-side.
  return { ...session, userId } as ValidationSession;
}