import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  buildReviewWhere,
  parseReviewListQuery,
} from "@/lib/admin/reviews-filter";

describe("parseReviewListQuery", () => {
  it("defaults to no search, no status and the first page", () => {
    const query = parseReviewListQuery(new URLSearchParams());
    expect(query.search).toBe("");
    expect(query.status).toBeNull();
    expect(query.page).toBe(1);
    expect(query.limit).toBe(DEFAULT_LIMIT);
  });

  it("trims the search term", () => {
    expect(parseReviewListQuery(new URLSearchParams({ search: "  refund  " })).search).toBe(
      "refund"
    );
  });

  it("accepts only known statuses", () => {
    expect(parseReviewListQuery(new URLSearchParams({ status: "PENDING" })).status).toBe(
      "PENDING"
    );
    expect(parseReviewListQuery(new URLSearchParams({ status: "APPROVED" })).status).toBe(
      "APPROVED"
    );
    expect(parseReviewListQuery(new URLSearchParams({ status: "REJECTED" })).status).toBe(
      "REJECTED"
    );
    expect(parseReviewListQuery(new URLSearchParams({ status: "DELETED" })).status).toBeNull();
  });

  it("clamps page and limit into range", () => {
    expect(parseReviewListQuery(new URLSearchParams({ page: "0" })).page).toBe(1);
    expect(parseReviewListQuery(new URLSearchParams({ page: "-4" })).page).toBe(1);
    expect(parseReviewListQuery(new URLSearchParams({ limit: "0" })).limit).toBe(1);
    expect(parseReviewListQuery(new URLSearchParams({ limit: "9999" })).limit).toBe(MAX_LIMIT);
  });

  it("falls back when page or limit is not a number", () => {
    const query = parseReviewListQuery(new URLSearchParams({ page: "abc", limit: "xyz" }));
    expect(query.page).toBe(1);
    expect(query.limit).toBe(DEFAULT_LIMIT);
  });
});

describe("buildReviewWhere", () => {
  it("is empty when there is no status or search", () => {
    expect(buildReviewWhere({ search: "", status: null })).toEqual({});
  });

  it("filters by status alone", () => {
    expect(buildReviewWhere({ search: "", status: "PENDING" })).toEqual({ status: "PENDING" });
  });

  it("searches comment, user name and user email case-insensitively", () => {
    expect(buildReviewWhere({ search: "alice", status: null })).toEqual({
      OR: [
        { comment: { contains: "alice", mode: "insensitive" } },
        { user: { name: { contains: "alice", mode: "insensitive" } } },
        { user: { email: { contains: "alice", mode: "insensitive" } } },
      ],
    });
  });

  it("combines status and search", () => {
    const where = buildReviewWhere({ search: "slow", status: "APPROVED" });
    expect(where.status).toBe("APPROVED");
    expect(Array.isArray(where.OR)).toBe(true);
  });
});
