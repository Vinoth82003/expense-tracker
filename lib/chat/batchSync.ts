/**
 * Pure helpers for folding a Sage multi-transaction batch into the lists held
 * by UserContext.
 *
 * Sage reports one chat message as a single `batchTransactionsAdded` event whose
 * payload is `{ expenses[], incomes[], budget }`, not one event per record. These
 * helpers are kept free of React so the merge semantics can be unit tested.
 */

export type BatchSyncRecord = {
  id: string;
  date: string | Date;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * `""` for a date we cannot parse. A caller must be able to tell "no month"
 * apart from a real bucket — `"NaN-NaN"` silently matched neither the current
 * nor the previous month, so a malformed record looked exactly like a record
 * that had already been applied.
 */
export const monthKeyOf = (date: string | Date): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/**
 * Buckets records into "this month" and "last month" relative to `now`.
 * Records outside both windows are dropped: the context only tracks those two.
 */
export function splitByMonth<T extends BatchSyncRecord>(
  items: T[],
  now: Date = new Date(),
): { current: T[]; previous: T[] } {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const previousMonth = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;

  const current: T[] = [];
  const previous: T[] = [];
  for (const item of items) {
    const key = monthKeyOf(item.date);
    if (key === month) current.push(item);
    else if (key === previousMonth) previous.push(item);
  }
  return { current, previous };
}

/**
 * Prepends `incoming` to `existing`, dropping ids already present and keeping
 * the list sorted newest-first. Existing records are never mutated or reordered
 * relative to each other beyond the stable sort.
 */
export function mergeById<T extends BatchSyncRecord>(
  existing: T[],
  incoming: T[],
): T[] {
  if (incoming.length === 0) return existing;

  const seen = new Set(existing.map((x) => x.id));
  const fresh = incoming.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  if (fresh.length === 0) return existing;

  return fresh
    .concat(existing)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Events the chat route can return and the UI must react to. */
export const SYNC_EVENTS = [
  "expenseAdded",
  "incomeAdded",
  "budgetUpdated",
  "batchTransactionsAdded",
] as const;

export type SyncEventType = (typeof SYNC_EVENTS)[number];

/** The write a sync event describes, independent of which event carried it. */
export interface NormalizedSync {
  expenses: Array<Record<string, unknown>>;
  incomes: Array<Record<string, unknown>>;
  /** Monthly budget amount, present only when the write changed the budget. */
  budgetAmount?: number;
  /** Mode the write put the user into, when it set one explicitly. */
  expenseMode?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asArray = (v: unknown): Array<Record<string, unknown>> =>
  Array.isArray(v) ? (v.filter(isObject) as Array<Record<string, unknown>>) : [];

/**
 * A stored expense/income row, as opposed to a budget row.
 *
 * The discriminator is `date`: every transaction carries one, while a budget
 * document is `{ id, userId, month, amount }` and has no date. Without this,
 * a budget payload is indistinguishable from a transaction by `amount` alone.
 */
const isTransactionRecord = (v: unknown): boolean =>
  isObject(v) &&
  typeof v.amount === "number" &&
  (typeof v.date === "string" || v.date instanceof Date);

/** The batch envelope, `{ expenses[], incomes[], budget }`. */
const isBatchEnvelope = (v: unknown): boolean =>
  isObject(v) && (Array.isArray(v.expenses) || Array.isArray(v.incomes));

/**
 * Collapses every sync payload shape the chat route can emit into one write
 * description, so a subscriber never has to know which server path produced it.
 *
 * This exists because the event NAME is not a reliable description of the
 * payload. The batch executor emits `expenseAdded` for a single-expense message
 * but still sends the full batch envelope, while the legacy and v2-engine paths
 * send the bare row under that same name. Treating `expenseAdded` as "the
 * detail *is* one expense" therefore dropped the record on the floor: the
 * merge keyed off `detail.date`, found `undefined`, and merged nothing. The
 * write was only ever visible to views that re-fetch, which is exactly the
 * "it shows up a moment later" behaviour.
 *
 * Returns `null` when the payload carries no usable write, which tells the
 * caller to re-read from the server rather than silently no-op.
 */
export function normalizeSyncPayload(
  eventType: string,
  detail: unknown
): NormalizedSync | null {
  if (detail === undefined || detail === null) return null;

  if (isBatchEnvelope(detail)) {
    // `isBatchEnvelope` confirms the shape at runtime; the cast gives the
    // compiler the same fact.
    const envelope = detail as unknown as Record<string, unknown>;
    const budget = envelope.budget;
    const budgetAmount =
      isObject(budget) && typeof budget.amount === "number" ? budget.amount : undefined;
    return {
      expenses: asArray(envelope.expenses),
      incomes: asArray(envelope.incomes),
      ...(budgetAmount !== undefined ? { budgetAmount } : {}),
      ...(typeof envelope.expenseMode === "string"
        ? { expenseMode: envelope.expenseMode }
        : {}),
    };
  }

  if (!isObject(detail)) return null;

  switch (eventType) {
    case "expenseAdded":
      return isTransactionRecord(detail)
        ? { expenses: [detail], incomes: [] }
        : null;

    case "incomeAdded":
      return isTransactionRecord(detail)
        ? { expenses: [], incomes: [detail] }
        : null;

    case "budgetUpdated": {
      // The legacy path sends `{ limit, expenseMode }`; the v2 engine and the
      // batch executor send the budget document itself, which calls it `amount`.
      const amount =
        typeof detail.limit === "number"
          ? detail.limit
          : typeof detail.amount === "number"
            ? detail.amount
            : undefined;
      if (amount === undefined) return null;
      return {
        expenses: [],
        incomes: [],
        budgetAmount: amount,
        ...(typeof detail.expenseMode === "string"
          ? { expenseMode: detail.expenseMode }
          : {}),
      };
    }

    default:
      return null;
  }
}