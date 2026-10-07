import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/**
 * Module 14 — competitor SEO analysis (compare-page accuracy guard).
 *
 * The comparison tables must only assert ✗ against a competitor when the
 * absence is grounded in research evidence. Unverifiable specifics render as
 * "unknown" (tri-state), never as an implied ✗ (see
 * docs/seo/14-competitor-seo-analysis-and-keyword-gap.md §3).
 */

// Features whose ABSENCE on the competitor column is grounded in the module 14
// research evidence (SMS/notification orientation, monthly-only reporting,
// investor/lender positioning, no receipt scanning).
const COMPETITOR_FALSE_ALLOWLIST = new Set([
  "Receipt scanning",
  "April–March FY reports",
  "Lakhs/Crores formatting",
  "Tax-season PDF export",
  "GST-ready categorization",
  "Web app (no install required)",
  "No loan cross-selling",
  "No investment cross-selling",
]);

// Favourably-known SpendWise gaps that legitimately render ✗ on our column.
const SPENDWISE_FALSE_ALLOWLIST = new Set([
  "Receipt scanning",
  "April–March FY reports",
  "Lakhs/Crores formatting",
  "Tax-season PDF export",
  "GST-ready categorization",
  "80C/80D tracking",
  "Investment recommendations",
  "Premium plan",
]);

// Lines of the form { feature: "...", spendwise: X, competitor: Y }
const CELL_LINE = /feature: "([^"]+)", spendwise: (true|false|"[^"]*"|"unknown"), competitor: (true|false|"[^"]*"|"unknown")/;

function collectCells(file: string) {
  const cells: { feature: string; spendwise: string; competitor: string }[] = [];
  for (const line of read(file).split("\n")) {
    const m = line.match(CELL_LINE);
    if (m) {
      cells.push({ feature: m[1], spendwise: m[2], competitor: m[3] });
    }
  }
  return cells;
}

describe("comparison pages", () => {
  it("both compare pages exist with canonical, ComparisonPage schema, and breadcrumb", () => {
    for (const slug of ["spendwise-vs-walnut", "spendwise-vs-et-money"]) {
      const page = read(`app/compare/${slug}/page.tsx`);
      expect(page).toContain(`canonical: "/compare/${slug}"`);
      expect(page).toContain('"@type": "ComparisonPage"');
      expect(page).toContain('comparisonStructuredData');
      expect(page).toContain("@/components/seo/SiteBreadcrumbs");
    }
  });

  it("compare pages are linked from the footer and the HTML sitemap", () => {
    const footer = read("components/layout/Footer.tsx");
    const sitemap = read("app/sitemap/page.tsx");
    for (const slug of ["spendwise-vs-walnut", "spendwise-vs-et-money"]) {
      expect(footer).toContain(`/compare/${slug}`);
      expect(sitemap).toContain(`/compare/${slug}`);
    }
  });
});

describe("competitor claim accuracy (no fabricated ✗)", () => {
  const cells = collectCells("app/compare/CompareClient.tsx");

  it("parses every comparison row", () => {
    expect(cells.length).toBeGreaterThanOrEqual(30);
  });

  it("competitor ✗ cells are restricted to research-grounded features", () => {
    const offenders = cells
      .filter((c) => c.competitor === "false")
      .map((c) => c.feature)
      .filter((f) => !COMPETITOR_FALSE_ALLOWLIST.has(f));
    expect(offenders).toEqual([]);
  });

  it("spendwise ✗ cells are restricted to known gaps", () => {
    const offenders = cells
      .filter((c) => c.spendwise === "false")
      .map((c) => c.feature)
      .filter((f) => !SPENDWISE_FALSE_ALLOWLIST.has(f));
    expect(offenders).toEqual([]);
  });

  it("unverifiable competitor specifics are marked 'unknown' (tri-state in use)", () => {
    // Two-factor auth and the OAuth provider for both competitors are not
    // publicly verifiable — they must be "unknown", never a boolean.
    const unverifiable = ["Two-factor authentication", "OAuth login (Google)"];
    for (const feature of unverifiable) {
      const row = cells.find((c) => c.feature === feature);
      expect(row, feature).toBeDefined();
      expect(row!.competitor).toBe('"unknown"');
    }
    // Sandbox-level AI/intelligence specifics must not be asserted ✗.
    for (const feature of ["Anomaly detection", "Balance forecasting"]) {
      const rows = cells.filter((c) => c.feature === feature);
      for (const row of rows) {
        expect(row.competitor).toBe('"unknown"');
      }
    }
  });

  it("uses evidence-based language (no 'many users', 'afterthought', degraded superlatives)", () => {
    const src = read("app/compare/CompareClient.tsx");
    for (const banned of ["many users report", "become an afterthought"]) {
      expect(src, banned).not.toContain(banned);
    }
  });
});