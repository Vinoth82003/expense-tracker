import type { Prisma } from "@prisma/client";

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

export const OTP_STATUSES = ["SUCCESS", "FAILED", "EXPIRED"] as const;
export const LOGIN_STATUSES = ["SUCCESS", "FAILED", "BLOCKED", "CHALLENGED"] as const;

const OTP_STATUS_SET = new Set<string>(OTP_STATUSES);
const LOGIN_STATUS_SET = new Set<string>(LOGIN_STATUSES);

export interface SessionListQuery {
  search: string;
  status: string | null;
  method: string | null;
  userId: string | null;
  from: Date | null;
  to: Date | null;
  page: number;
  limit: number;
  dateInvalid: boolean;
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

function parseDateParam(raw: string | null): Date | "invalid" | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

export function parseSessionListQuery(searchParams: URLSearchParams): SessionListQuery {
  const from = parseDateParam(searchParams.get("from"));
  const to = parseDateParam(searchParams.get("to"));

  const rawStatus = searchParams.get("status");
  const rawMethod = searchParams.get("method");

  return {
    search: (searchParams.get("search") || "").trim(),
    status: rawStatus && rawStatus !== "All" ? rawStatus : null,
    method: rawMethod && rawMethod !== "All" ? rawMethod : null,
    userId: searchParams.get("userId") || null,
    from: from === "invalid" ? null : from,
    to: to === "invalid" ? null : to,
    page: clampInt(searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER),
    limit: clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    dateInvalid: from === "invalid" || to === "invalid",
  };
}

function dateRange(range: { from: Date | null; to: Date | null }): Prisma.DateTimeFilter | undefined {
  if (!range.from && !range.to) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (range.from) filter.gte = range.from;
  if (range.to) filter.lte = range.to;
  return filter;
}

export function buildOtpWhere(q: SessionListQuery): Prisma.OTPLogWhereInput {
  const where: Prisma.OTPLogWhereInput = {};

  if (q.status && OTP_STATUS_SET.has(q.status)) where.status = q.status;
  if (q.userId) where.userId = q.userId;

  const createdAt = dateRange(q);
  if (createdAt) where.createdAt = createdAt;

  if (q.search) {
    where.OR = [
      { email: { contains: q.search, mode: "insensitive" } },
      { ip: { contains: q.search, mode: "insensitive" } },
      { user: { is: { name: { contains: q.search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

export function buildLoginWhere(q: SessionListQuery): Prisma.LoginHistoryWhereInput {
  const where: Prisma.LoginHistoryWhereInput = {};

  if (q.status && LOGIN_STATUS_SET.has(q.status)) where.status = q.status;
  if (q.method) where.method = q.method;
  if (q.userId) where.userId = q.userId;

  const createdAt = dateRange(q);
  if (createdAt) where.createdAt = createdAt;

  if (q.search) {
    where.OR = [
      { ip: { contains: q.search, mode: "insensitive" } },
      { device: { contains: q.search, mode: "insensitive" } },
      { user: { is: { email: { contains: q.search, mode: "insensitive" } } } },
      { user: { is: { name: { contains: q.search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

export function buildSessionWhere(q: SessionListQuery): Prisma.UserSessionWhereInput {
  const where: Prisma.UserSessionWhereInput = {};

  if (q.userId) where.userId = q.userId;

  const createdAt = dateRange(q);
  if (createdAt) where.createdAt = createdAt;

  if (q.search) {
    where.OR = [
      { ip: { contains: q.search, mode: "insensitive" } },
      { device: { contains: q.search, mode: "insensitive" } },
      { browser: { contains: q.search, mode: "insensitive" } },
      { user: { is: { email: { contains: q.search, mode: "insensitive" } } } },
      { user: { is: { name: { contains: q.search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

export type DerivedSessionStatus = "active" | "expired";

/** A session is active while its expiry is in the future; otherwise expired. */
export function deriveSessionStatus(expires: Date | string, now: Date = new Date()): DerivedSessionStatus {
  const expiry = typeof expires === "string" ? new Date(expires) : expires;
  if (Number.isNaN(expiry.getTime())) return "expired";
  return expiry.getTime() > now.getTime() ? "active" : "expired";
}

/**
 * Masks an email's local part for display (e.g. `jane.doe@x.com` → `j***e@x.com`).
 * Used on the OTP log so full delivery destinations are not needlessly exposed.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0] ?? "*"}***${domain}`;
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}
