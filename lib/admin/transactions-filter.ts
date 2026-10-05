/**
 * Shared query builder for the admin transactions views.
 *
 * `app/api/admin/expenses` and `app/api/admin/income` are near-duplicates of each
 * other, so every filter lives here once and both endpoints consume it. This also
 * keeps the filters testable in isolation (see tests/admin-transactions-filter.test.ts).
 */

/** Amounts above this are surfaced to admins as outliers ("flagged"). */
export const FLAGGED_THRESHOLD = {
  expense: 10000,
  income: 50000,
} as const;

export type TransactionKind = keyof typeof FLAGGED_THRESHOLD;

export interface TransactionFilterInput {
  userId?: string | null;
  search?: string | null;
  category?: string | null;
  from?: string | null;
  to?: string | null;
  minAmount?: string | null;
  maxAmount?: string | null;
  flagged?: boolean;
}

/** Guards against absurd input from the admin filter bar. */
const MAX_SEARCH_LENGTH = 120;

/** `Infinity` when the value is absent or not a finite number. */
function toFiniteNumber(value?: string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Ignores the API's "All" sentinel and blank strings alike. */
function normaliseCategory(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "All") return null;
  return trimmed;
}

/**
 * The predicates `buildTransactionWhere` can produce.
 *
 * Declared explicitly so the builder stays introspectable (and unit-testable)
 * without falling back to `any`; each endpoint casts it to its own model's
 * `where` input at the Prisma call site.
 */
export type TransactionWhereClause = {
  userId?: string;
  category?: string;
  source?: string;
  user?: {
    is: {
      OR: Array<
        | { name: { contains: string; mode: "insensitive" } }
        | { email: { contains: string; mode: "insensitive" } }
      >;
    };
  };
  date?: { gte?: Date; lte?: Date };
  amount?: { gt?: number; gte?: number; lte?: number };
};

/**
 * Builds a Prisma `where` clause for the admin transaction tables.
 *
 * Every predicate is applied in the database. In particular the flagged filter is
 * part of `where` rather than a post-`findMany` `.filter()` — filtering after
 * pagination returned `total` counts (and therefore page numbers) for the
 * *unfiltered* result set.
 */
export function buildTransactionWhere(
  input: TransactionFilterInput,
  kind: TransactionKind
): TransactionWhereClause {
  const where: TransactionWhereClause = {};

  if (input.userId) where.userId = input.userId;

  const category = normaliseCategory(input.category);
  if (category) {
    // Expense rows carry `category` ("Needs" / "Wants"); income rows carry `source`.
    where[kind === "expense" ? "category" : "source"] = category;
  }

  // Search is scoped to the owning user, which is what an admin actually wants
  // here: "show me everything this person spent", by name or by email.
  const search = input.search?.trim().slice(0, MAX_SEARCH_LENGTH);
  if (search) {
    where.user = {
      is: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    };
  }

  if (input.from || input.to) {
    const from = toFiniteDate(input.from);
    const to = toFiniteDate(input.to);
    if (from || to) {
      where.date = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
  }

  const min = toFiniteNumber(input.minAmount);
  const max = toFiniteNumber(input.maxAmount);
  const amount: Record<string, number> = {
    ...(min !== null ? { gte: min } : {}),
    ...(max !== null ? { lte: max } : {}),
    ...(input.flagged ? { gt: FLAGGED_THRESHOLD[kind] } : {}),
  };
  if (Object.keys(amount).length > 0) where.amount = amount;

  return where;
}

function toFiniteDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Builds the `user` select shape shared by both transaction endpoints. */
export const TRANSACTION_USER_SELECT = {
  name: true,
  email: true,
  avatar: true,
} as const;