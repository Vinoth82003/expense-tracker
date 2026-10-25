import type { Prisma } from "@prisma/client";

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

/** Columns that may be used for ORDER BY — anything else falls back to createdAt. */
export const SORTABLE_USER_FIELDS = [
  "createdAt",
  "lastActive",
  "name",
  "email",
  "twoFactorEnabled",
  "expenseMode",
  "isSuspended",
] as const;

const SORTABLE = new Set<string>(SORTABLE_USER_FIELDS);

export interface UserListQuery {
  search: string;
  twoFA: string | null;
  mode: string | null;
  joined: string | null;
  page: number;
  limit: number;
  sortBy: (typeof SORTABLE_USER_FIELDS)[number];
  sortOrder: Prisma.SortOrder;
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function parseUserListQuery(searchParams: URLSearchParams): UserListQuery {
  const requestedSort = searchParams.get("sortBy") || "createdAt";
  const sortBy = (SORTABLE.has(requestedSort) ? requestedSort : "createdAt") as UserListQuery["sortBy"];

  return {
    search: (searchParams.get("search") || "").trim(),
    twoFA: searchParams.get("twoFA"),
    mode: searchParams.get("mode"),
    joined: searchParams.get("joined"),
    page: clampInt(searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER),
    limit: clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    sortBy,
    sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
  };
}

export function buildUsersWhere(query: Pick<UserListQuery, "search" | "twoFA" | "mode" | "joined">): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.twoFA === "Enabled") where.twoFactorEnabled = true;
  if (query.twoFA === "Disabled") where.twoFactorEnabled = false;

  if (query.mode === "Limit") where.expenseMode = "limit";
  if (query.mode === "No-limit") where.expenseMode = "no-limit";
  if (query.mode === "Unset") where.expenseMode = null;

  if (query.joined === "Last 7d") {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  } else if (query.joined === "Last 30d") {
    where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }

  return where;
}
