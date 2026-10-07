import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Foundation SEO invariants for Module 01.
// These tests lock the robots/sitemap/llms.txt contract so later modules
// cannot silently reintroduce indexation holes or fabricated lastmod values.
// ---------------------------------------------------------------------------

const CANONICAL_HOST = "thespendwise.vercel.app";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => {
      if (key === "host") return process.env.__TEST_HOST__ ?? CANONICAL_HOST;
      return null;
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    doc: {
      findMany: vi.fn(async () => []),
    },
  },
}));

import robots from "@/app/robots";
import sitemap, { STATIC_ROUTE_LASTMOD } from "@/app/sitemap";
import { prisma } from "@/lib/prisma";
import { STATIC_GUIDES } from "@/lib/docs-guides";

const publicPath = path.join(__dirname, "..", "public");

type RobotsRule = { userAgent?: string | string[]; allow?: string[]; disallow?: string[] };

function asRuleArray(rules: unknown): RobotsRule[] {
  return Array.isArray(rules) ? (rules as RobotsRule[]) : [rules as RobotsRule];
}

function lastmodTime(value: string | Date | undefined): number {
  if (!value) return Number.NaN;
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

describe("robots.txt — canonical marketing host", () => {
  beforeEach(() => {
    process.env.__TEST_HOST__ = CANONICAL_HOST;
  });

  it("allows public marketing paths and disallows private app paths", async () => {
    const result = await robots();

    const rule = asRuleArray(result.rules).find(
      (r) =>
        r.userAgent === "*" ||
        (Array.isArray(r.userAgent) && r.userAgent.includes("*"))
    ) as RobotsRule;

    expect(rule.allow).toEqual(
      expect.arrayContaining([
        "/",
        "/features",
        "/how-it-works",
        "/faq",
        "/docs",
        "/contact",
        "/privacy",
        "/terms",
        "/download",
        "/reviews",
        "/tools/",
        "/compare/",
      ])
    );

    // Auth/admin/API surfaces must stay blocked.
    expect(rule.disallow).toEqual(
      expect.arrayContaining([
        "/admin",
        "/bridge",
        "/dashboard",
        "/api",
        "/login",
        "/onboarding",
        "/verify-2fa",
        "/maintenance",
      ])
    );
  });

  it("does not disallow the homepage while allowing it", async () => {
    const result = await robots();
    const rule = asRuleArray(result.rules)[0];
    expect(rule.allow).toContain("/");
    expect(rule.disallow).not.toContain("/");
  });

  it("advertises the sitemap on the canonical host", async () => {
    const result = await robots();
    expect(result.sitemap).toBe(`https://${CANONICAL_HOST}/sitemap.xml`);
  });
});

describe("robots.txt — non-canonical host", () => {
  it("blanket-disallows everything and omits the sitemap", async () => {
    process.env.__TEST_HOST__ = "money-spend-tracker.vercel.app";

    const result = await robots();

    expect(asRuleArray(result.rules)).toEqual([
      { userAgent: "*", disallow: ["/"] },
    ]);
    expect(result.sitemap).toBeUndefined();
  });
});

describe("sitemap.xml", () => {
  beforeEach(() => {
    process.env.__TEST_HOST__ = CANONICAL_HOST;
    (prisma.doc.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("includes the core public marketing routes", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        // Home is the bare origin (no trailing slash) in sitemap.ts.
        `https://${CANONICAL_HOST}`,
        `https://${CANONICAL_HOST}/features`,
        `https://${CANONICAL_HOST}/how-it-works`,
        `https://${CANONICAL_HOST}/faq`,
        `https://${CANONICAL_HOST}/docs`,
        `https://${CANONICAL_HOST}/tools/50-30-20-budget-calculator`,
      ])
    );
  });

  it("keeps /status out of the sitemap (volatile, noindex)", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).not.toContain(`https://${CANONICAL_HOST}/status`);
  });

  it("uses per-route lastModified constants — never request-time now()", async () => {
    const before = Date.now();
    const entries = await sitemap();
    const after = Date.now();

    const home = entries.find((e) => e.url === `https://${CANONICAL_HOST}`);
    expect(home).toBeDefined();

    // STATIC_ROUTE_LASTMOD["/"] is "2026-09-26". If lastmod churned to "now",
    // the timestamp would sit between before/after.
    const homeLast = lastmodTime(home!.lastModified);
    const constantLast = new Date(
      `${STATIC_ROUTE_LASTMOD["/"]}T00:00:00.000Z`
    ).getTime();

    expect(homeLast).toBe(constantLast);
    expect(homeLast).toBeLessThan(before);
    expect(homeLast).toBeLessThan(after);
  });

  it("falls back to a fixed old date when a route has no lastmod entry", async () => {
    const entries = await sitemap();
    const sitemapPage = entries.find(
      (e) => e.url === `https://${CANONICAL_HOST}/sitemap`
    );
    expect(sitemapPage).toBeDefined();
    // Either it has an explicit constant or the shared fixed fallback — both
    // must be far older than "now" and must not equal Date.now().
    const last = lastmodTime(sitemapPage!.lastModified);
    expect(last).toBeLessThan(Date.now() - 24 * 60 * 60 * 1000);
  });

  it("appends published docs from the database", async () => {
    (prisma.doc.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        slug: "getting-started",
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ]);

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`https://${CANONICAL_HOST}/docs/getting-started`);
  });

  it("still lists repo-owned guides when the database fails", async () => {
    (prisma.doc.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down")
    );

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`https://${CANONICAL_HOST}/features`);

    // Guides live in lib/docs-guides.ts, so they ship without the DB; every
    // /docs/* entry in this fallback must come from that repo-owned set.
    const docUrls = urls.filter((u) => u.includes("/docs/"));
    const guideUrls = STATIC_GUIDES.map(
      (g) => `https://${CANONICAL_HOST}/docs/${g.slug}`
    );
    expect(docUrls.sort()).toEqual([...guideUrls].sort());
  });
});

describe("llms.txt", () => {
  it("exists in public/ because layout and robots both reference it", () => {
    const filePath = path.join(publicPath, "llms.txt");
    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, "utf8");
    expect(content).toContain("SpendWise");
    expect(content).toContain("thespendwise.vercel.app");
    // Must not invent rankings, awards, or user counts.
    expect(content).not.toMatch(/India's #1|best expense tracker|award/i);
  });
});
