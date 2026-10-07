import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Module 20 — advanced technical SEO, crawl budget & indexation control.
// Locks in indexation classification, crawl surface discipline, middleware
// X-Robots-Tag coverage, robots allowlist/disallow discipline, sitemap scope,
// and defense-in-depth against indexation leaks.
// ---------------------------------------------------------------------------

const root = path.resolve(__dirname, "..");

function read(p: string): string {
  return fs.readFileSync(path.join(root, p), "utf8");
}

function dirExists(p: string): boolean {
  return fs.existsSync(path.join(root, p));
}

const INDEXABLE_PATHS = [
  "/",
  "/features",
  "/how-it-works",
  "/faq",
  "/docs",
  "/contact",
  "/press",
  "/privacy",
  "/terms",
  "/download",
  "/reviews",
  "/sitemap",
  "/compare/spendwise-vs-walnut",
  "/compare/spendwise-vs-et-money",
  "/tools",
  "/tools/50-30-20-budget-calculator",
  "/tools/salary-budget-calculator",
  "/tools/emergency-fund-calculator",
  "/docs/getting-started",
  "/docs/category-insights",
  "/docs/monthly-budgeting-guide",
  "/docs/50-30-20-budgeting-guide",
  "/docs/expense-tracking-guide",
];

const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/bridge",
  "/dashboard",
  "/expenses",
  "/income",
  "/groups",
  "/profile",
  "/settings",
  "/reports",
  "/analyze",
  "/feedback",
  "/notifications",
  "/api",
  "/login",
  "/onboarding",
  "/verify-2fa",
  "/maintenance",
];

describe("Module 20 — crawl budget & indexation control", () => {
  it("robots.txt has explicit allowlist and blocks private/auth/API surfaces", () => {
    const robots = read("app/robots.ts");
    expect(robots).toContain("ALLOWED_PATHS");
    expect(robots).toContain("DISALLOWED_PATHS");
    expect(robots).toContain("/compare/");
    expect(robots).toContain("/tools/");
    expect(robots).toContain("/api");
    expect(robots).toContain('"/admin"');
    expect(robots).toContain('"/login"');
    expect(robots).toContain('"/bridge"');
    expect(robots).toContain("AI_CRAWLERS");
    expect(robots).toContain("isNonCanonicalHost");
    expect(robots).toMatch(/Disallow:\s*\//);
  });

  it("middleware sets X-Robots-Tag on private-matched responses", () => {
    const mw = read("middleware.ts");
    expect(mw).toContain("X-Robots-Tag");
    expect(mw).toContain("noindex, nofollow");
    expect(mw).toContain("withPrivateRobots");
  });

  it("sitemap only includes indexable marketing routes and no status/private", () => {
    const sitemap = read("app/sitemap.ts");
    expect(sitemap).toContain('"/press"');
    expect(sitemap).toContain('"/tools"');
    // Ensure /status is not actually included as a sitemap route
    expect(sitemap).not.toMatch(/staticRoute\([^,]+,\s*"\/status"/);
    expect(sitemap).not.toMatch(/\/login/);
    expect(sitemap).not.toMatch(/\/admin/);
    expect(sitemap).not.toMatch(/\/api/);
  });

  it("auth/error boundaries exist but are not indexable (covered by robots+mw)", () => {
    expect(dirExists("app/error.tsx")).toBe(true);
    expect(dirExists("app/global-error.tsx")).toBe(true);
    expect(dirExists("app/not-found.tsx")).toBe(true);
    const robots = read("app/robots.ts");
    const mw = read("middleware.ts");
    for (const p of ["/login", "/bridge", "/admin", "/api", "/onboarding"]) {
      expect(robots).toMatch(new RegExp(`"${p}"`));
    }
    expect(mw).toContain("withPrivateRobots");
  });

  it("canonical/metadata discipline is intact for key marketing routes", () => {
    for (const rel of [
      "app/features/page.tsx",
      "app/how-it-works/page.tsx",
      "app/faq/page.tsx",
      "app/contact/page.tsx",
      "app/press/page.tsx",
    ]) {
      const src = read(rel);
      expect(src).toContain("alternates");
    }
  });

  it("module 20 audit documents indexation classification and crawl control", () => {
    const doc = read("../docs/seo/20-advanced-technical-seo-crawl-budget-and-indexation-control-audit.md" as string);
    expect(doc).toMatch(/INDEX|NOINDEX|REDIRECT|APPLICATION|ERROR|BLOCK/i);
    expect(doc).toMatch(/X-Robots-Tag|robots\.ts|sitemap/i);
    expect(doc).toMatch(/crawl budget/i);
  });
});