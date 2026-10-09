/**
 * Shared query builder and helpers for admin session management.
 *
 * Keeps session filtering, pagination parsing, and status derivation isolated
 * and unit-testable (see tests/admin-sessions-filter.test.ts).
 */

/** Guards against absurd input from the admin search bar. */
export const MAX_SEARCH_LENGTH = 120;

/** Default page size for session lists. */
export const DEFAULT_PAGE_SIZE = 25;

export type SessionStatus = "active" | "expired";

export interface SessionFilterInput {
  userId?: string | null;
  search?: string | null;
  from?: Date | string | null;
  to?: Date | string | null;
  status?: string | null;
}

export interface SessionListQuery extends SessionFilterInput {
  page: number;
  limit: number;
  dateInvalid: boolean;
}

/**
 * Normalises arbitrary input dates into a valid Date instance, or `null`
 * if missing or invalid.
 */
export function toFiniteDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Safely parses query parameters for the admin sessions endpoint.
 *
 * Validates pagination bounds and checks date range validity so callers
 * can reject malformed date inputs with a 400 Bad Request.
 */
export function parseSessionListQuery(
  input: URLSearchParams | Record<string, string | null | undefined | string[]> | string
): SessionListQuery {
  const params: { get: (key: string) => string | null } =
    input instanceof URLSearchParams
      ? input
      : typeof input === "string"
        ? new URLSearchParams(input)
        : {
            get: (key: string) => {
              const val = (input as Record<string, any>)[key];
              if (Array.isArray(val)) return val[0] ?? null;
              return val !== undefined && val !== null ? String(val) : null;
            },
          };

  const pageRaw = parseInt(params.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const limitRaw = parseInt(params.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, 100)
      : DEFAULT_PAGE_SIZE;

  const searchRaw = params.get("search")?.trim();
  const search = searchRaw ? searchRaw.slice(0, MAX_SEARCH_LENGTH) : null;

  const userIdRaw = params.get("userId")?.trim();
  const userId = userIdRaw || null;

  const statusRaw = params.get("status")?.trim();
  const status = statusRaw && statusRaw !== "All" ? statusRaw : null;

  const fromRaw = params.get("from")?.trim();
  const toRaw = params.get("to")?.trim();

  let dateInvalid = false;
  let from: Date | null = null;
  let to: Date | null = null;

  if (fromRaw) {
    const parsed = toFiniteDate(fromRaw);
    if (!parsed) {
      dateInvalid = true;
    } else {
      from = parsed;
    }
  }

  if (toRaw) {
    const parsed = toFiniteDate(toRaw);
    if (!parsed) {
      dateInvalid = true;
    } else {
      to = parsed;
    }
  }

  if (from && to && from.getTime() > to.getTime()) {
    dateInvalid = true;
  }

  return {
    page,
    limit,
    search,
    userId,
    status,
    from,
    to,
    dateInvalid,
  };
}

/**
 * Derives whether a session is still active or has expired against reference timestamp `now`.
 */
export function deriveSessionStatus(
  expires: Date | string | number | null | undefined,
  now: Date = new Date()
): SessionStatus {
  if (!expires) return "expired";
  const expDate = expires instanceof Date ? expires : new Date(expires);
  if (Number.isNaN(expDate.getTime())) return "expired";
  return expDate.getTime() > now.getTime() ? "active" : "expired";
}

/**
 * Represents the typed Prisma where clause for UserSession queries.
 */
export type SessionWhereClause = {
  userId?: string;
  createdAt?: { gte?: Date; lte?: Date };
  expires?: { gt?: Date; lte?: Date };
  OR?: Array<
    | { user: { is: { name: { contains: string; mode: "insensitive" } } } }
    | { user: { is: { email: { contains: string; mode: "insensitive" } } } }
    | { ip: { contains: string; mode: "insensitive" } }
    | { device: { contains: string; mode: "insensitive" } }
    | { browser: { contains: string; mode: "insensitive" } }
  >;
};

/**
 * Builds a Prisma `where` clause for UserSession queries based on filter input.
 */
export function buildSessionWhere(
  input: SessionFilterInput,
  now: Date = new Date()
): SessionWhereClause {
  const where: SessionWhereClause = {};

  if (input.userId?.trim()) {
    where.userId = input.userId.trim();
  }

  const search = input.search?.trim().slice(0, MAX_SEARCH_LENGTH);
  if (search) {
    where.OR = [
      { user: { is: { name: { contains: search, mode: "insensitive" } } } },
      { user: { is: { email: { contains: search, mode: "insensitive" } } } },
      { ip: { contains: search, mode: "insensitive" } },
      { device: { contains: search, mode: "insensitive" } },
      { browser: { contains: search, mode: "insensitive" } },
    ];
  }

  if (input.from || input.to) {
    const from = toFiniteDate(input.from);
    const to = toFiniteDate(input.to);
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
  }

  if (input.status && input.status !== "All") {
    if (input.status === "active") {
      where.expires = { gt: now };
    } else if (input.status === "expired") {
      where.expires = { lte: now };
    }
  }

  return where;
}

/**
 * Shared user select fields for session endpoints.
 */
export const SESSION_USER_SELECT = {
  name: true,
  email: true,
  avatar: true,
} as const;
