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

export const monthKeyOf = (date: string | Date): string => {
  const d = new Date(date);
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