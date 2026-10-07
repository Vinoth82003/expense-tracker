import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/**
 * Module 15 — Google Search Console & SEO measurement infrastructure.
 *
 * Enforces the things that make GSC/GA4 readable and honest: a canonical
 * absolute sitemap on the marketing origin, strict lastmod discipline (no
 * runtime `now`), GSC verification assets present, and the measurement docs
 * existing with their "not yet measured" guardrails intact. It NEVER asserts
 * a numeric metric — real numbers only appear from GSC/GA4 once connected.
 */

describe("search-console wiring", () => {
  const layout = read("app/layout.tsx");

  it("root layout carries the GSC meta token", () => {
    expect(layout).toContain('google: "f1afae934a46160c"');
  });

  it("the legacy GSC HTML verification file exists and is non-empty", () => {
    const f = path.join(root, "public/google0fea68fbc5b16c67.html");
    expect(statSync(f).isFile()).toBe(true);
    expect(readFileSync(f, "utf8").trim().length).toBeGreaterThan(20);
  });

  it("has no invented Bing/Yandex verification tokens", () => {
    expect(layout).not.toMatch(/verification\s*:\s*\{[^}]*\bbing\b/);
    expect(layout).not.toMatch(/verification\s*:\s*\{[^}]*\byandex\b/);
  });
});

describe("sitemap & robots", () => {
  const robots = read("app/robots.ts");
  const sitemap = read("app/sitemap.ts");

  it("robots advertises the absolute marketing-origin sitemap", () => {
    expect(robots).toContain("sitemap: `${baseUrl}/sitemap.xml`");
    // Non-canonical host never advertises a sitemap.
    expect(robots).toContain("No Sitemap: line here");
  });

  it("robots allows marketing surfaces and blocks app/admin/api", () => {
    for (const allowed of ["/features", "/tools/", "/compare/", "/docs", "/sitemap", "/llms.txt"]) {
      expect(robots, allowed).toContain(`"${allowed}"`);
    }
    for (const blocked of ["/admin", "/api", "/dashboard", "/login", "/onboarding", "/analyze"]) {
      expect(robots, blocked).toContain(`"${blocked}"`);
    }
  });

  it("sitemap uses fixed per-route lastmod, never runtime now", () => {
    // Comments prose off, then no argument-less `new Date()` may remain.
    const codeOnly = sitemap
      .split("\n")
      .filter((l) => !/^\s*\/\//.test(l))
      .join("\n");
    // Fallback may use `new Date("...")` but an argument-less `new Date()`
    // would fabricate a fresh timestamp on every request.
    expect(codeOnly).not.toMatch(/new Date\(\)/);
    expect(sitemap).toContain('new Date("2026-06-01T00:00:00.000Z")');
  });

  it("sitemap covers the core indexable routes (home, compare, tools, no /status)", () => {
    for (const route of [
      '"/"',
      '"/compare/spendwise-vs-walnut"',
      '"/compare/spendwise-vs-et-money"',
      '"/tools"',
      '"/tools/50-30-20-budget-calculator"',
      '"/tools/salary-budget-calculator"',
      '"/tools/emergency-fund-calculator"',
    ]) {
      expect(sitemap, route).toContain(route);
    }
    // `/status` is intentionally indexable-absent: no lastmod entry and no
    // static route (prose comments may mention it, so strip them first).
    const codeOnly = sitemap
      .split("\n")
      .filter((l) => !/^\s*\/\//.test(l))
      .join("\n");
    expect(codeOnly).not.toMatch(/\/status/);
  });
});

describe("measurement docs", () => {
  it("change log exists and records a module entry for the initial package", () => {
    const log = read("../docs/seo/changelog.md" as string);
    expect(log).toContain("Modules 01–20 (initial package)");
    expect(log).toContain("336/336");
    // Append-only intent: dated sections, not an overwritten state.
    expect(log).toMatch(/^## 2026-10-06/m);
  });

  it("module 15 measurement doc ships an empty baseline with honesty guardrails", () => {
    const doc = read("../docs/seo/15-google-search-console-and-seo-measurement.md" as string);
    expect(doc).toContain("Baseline (empty by design)");
    expect(doc).toContain("Honesty guardrail");
    expect(doc).toContain("broken-promise incident");
    expect(doc).toMatch(/\| Impressions, Clicks, CTR/);
  });
});