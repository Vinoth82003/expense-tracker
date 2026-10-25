import type { Prisma } from "@prisma/client";

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const STATUS_SET = new Set<string>(REVIEW_STATUSES);

export interface ReviewListQuery {
  search: string;
  status: ReviewStatus | null;
  page: number;
  limit: number;
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function parseReviewListQuery(searchParams: URLSearchParams): ReviewListQuery {
  const rawStatus = searchParams.get("status");
  const status: ReviewStatus | null =
    rawStatus && STATUS_SET.has(rawStatus) ? (rawStatus as ReviewStatus) : null;

  return {
    search: (searchParams.get("search") || "").trim(),
    status,
    page: clampInt(searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER),
    limit: clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
  };
}

export function buildReviewWhere(
  query: Pick<ReviewListQuery, "search" | "status">
): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {};

  if (query.status) where.status = query.status;

  if (query.search) {
    where.OR = [
      { comment: { contains: query.search, mode: "insensitive" } },
      { user: { name: { contains: query.search, mode: "insensitive" } } },
      { user: { email: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
}
