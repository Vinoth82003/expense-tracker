import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const TOOLS = [
  {
    slug: "50-30-20-budget-calculator",
    client: "app/tools/50-30-20-budget-calculator/CalculatorClient.tsx",
    canonical: "/tools/50-30-20-budget-calculator",
  },
  {
    slug: "salary-budget-calculator",
    client: "app/tools/salary-budget-calculator/SalaryBudgetClient.tsx",
    canonical: "/tools/salary-budget-calculator",
  },
  {
    slug: "emergency-fund-calculator",
    client: "app/tools/emergency-fund-calculator/EmergencyFundClient.tsx",
    canonical: "/tools/emergency-fund-calculator",
  },
];

function faqNames(pageSource: string): string[] {
  const start = pageSource.indexOf('"@type": "FAQPage"');
  if (start === -1) return [];
  const block = pageSource.slice(start, start + 4000);
  const names: string[] = [];
  const re = /"name":\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) names.push(m[1]);
  return names;
}

describe("Module 07 — tools & calculators", () => {
  describe("per-tool page requirements", () => {
    it.each(TOOLS)("$slug has canonical + metadata", ({ slug, canonical }) => {
      const src = read(`app/tools/${slug}/page.tsx`);
      expect(src).toContain(`canonical: "${canonical}"`);
      expect(src).toMatch(/title:\s*"/);
      expect(src).toMatch(/description:\s*\n?\s*"/);
      expect(src).toContain(`${SITE_ORIGIN_MARKER}${canonical}`);
    });

    it.each(TOOLS)(
      "$slug emits WebApplication + FAQPage + BreadcrumbList JSON-LD",
      ({ slug }) => {
        const src = read(`app/tools/${slug}/page.tsx`);
        expect(src).toContain('"@type": "WebApplication"');
        expect(src).toContain('"@type": "FAQPage"');
        expect(src).toContain("breadcrumbJsonLd");
        expect(src).toContain("JSON.stringify(calculatorStructuredData)");
        expect(src).toContain("JSON.stringify(faqStructuredData)");
        expect(src).toContain("JSON.stringify(breadcrumbStructuredData)");
        // Free tool — never a paid offer.
        expect(src).toContain('"price": "0"');
      }
    );

    it.each(TOOLS)(
      "$slug shows methodology + limitations on the page",
      ({ client }) => {
        const src = read(client);
        expect(src).toContain("How this calculator works");
        expect(src).toContain("Limitations");
        expect(src).toContain("not financial advice");
      }
    );

    it.each(TOOLS)(
      "$slug FAQPage questions are visible page content",
      ({ slug, client }) => {
        const questions = faqNames(read(`app/tools/${slug}/page.tsx`));
        expect(questions.length).toBeGreaterThanOrEqual(3);
        const clientSrc = read(client).replace(/&apos;/g, "'");
        for (const q of questions) {
          expect(clientSrc, `question "${q}" missing from ${client}`).toContain(q);
        }
      }
    );

    it.each(TOOLS)(
      "$slug has accessible form labelling and live results",
      ({ client }) => {
        const src = read(client);
        expect(src).toContain('id="main-content"');
        expect(src).toContain('aria-live="polite"');
        expect(src).toContain("<label");
        expect(src).toMatch(/htmlFor=/);
        expect(src).toContain("SiteBreadcrumbs");
      }
    );

    it.each(TOOLS)("$slug breadcrumb parent points at /tools", ({ client }) => {
      expect(read(client)).toContain('{ label: "Tools", href: "/tools" }');
    });

    it.each(TOOLS)("$slug uses deterministic pure formulas", ({ slug }) => {
      const src = read(`app/tools/${slug}/page.tsx`);
      // Tools must not run `new Date()`, fetch, or Math.random in pages.
      expect(src).not.toMatch(/Math\.random|fetch\(|new Date\(/);
    });
  });

  describe("claim hygiene (no fabricated evidence)", () => {
    it.each(TOOLS)("no ratings, reviews, or usage counts on $slug", ({ slug, client }) => {
      const page = read(`app/tools/${slug}/page.tsx`);
      const clientSrc = read(client);
      for (const src of [page, clientSrc]) {
        expect(src).not.toMatch(/★|\d\.\d\s*\/\s*5|rated\s+\d|out of 5/i);
        expect(src).not.toMatch(/review(ed|s)?\s+by/i);
        expect(src).not.toMatch(/(thousands|millions|lakhs) of (users|customers)/i);
        expect(src).not.toMatch(/guaranteed|clinically proven|approved by/i);
      }
    });
  });

  describe("tools hub (/tools)", () => {
    const hub = read("app/tools/page.tsx");

    it("exists with canonical /tools and indexable metadata", () => {
      expect(hub).toContain('canonical: "/tools"');
      expect(hub).toContain("Free Financial Tools");
    });

    it("links every tool in the cluster", () => {
      for (const { canonical } of TOOLS) {
        expect(hub).toContain(`"${canonical}"`);
      }
    });

    it("emits breadcrumb + ItemList structured data", () => {
      expect(hub).toContain("breadcrumbJsonLd");
      expect(hub).toContain('"@type": "ItemList"');
    });

    it("hub is the breadcrumb target for every tool", () => {
      for (const { client } of TOOLS) {
        expect(read(client)).toContain('href: "/tools"');
      }
      expect(hub).toContain('items={[{ label: "Tools" }]}');
    });
  });

  describe("discoverability (sitemap, lastmod, robots)", () => {
    const sitemap = read("app/sitemap.ts");

    it("all tool routes are static sitemap entries with a pinned lastmod", () => {
      for (const { canonical } of [...TOOLS.map((t) => ({ canonical: t.canonical })), { canonical: "/tools" }]) {
        expect(sitemap).toContain(`"${canonical}"`);
        expect(sitemap).toContain(`"${canonical}": "2026-10-06"`);
      }
    });

    it("robots allows the tools cluster", () => {
      expect(read("app/robots.ts")).toMatch(/"\/tools\/"/);
    });
  });

  describe("tested formula library (lib/calculators.ts)", () => {
    const lib = read("lib/calculators.ts");

    it("is pure — no I/O, time, or randomness", () => {
      expect(lib).not.toMatch(/fetch\(|XMLHttpRequest|Math\.random|new Date\(/);
      expect(lib).not.toMatch(/localStorage|sessionStorage|window\.|document\./);
    });

    it("is exercised by a dedicated unit test file", () => {
      const test = read("tests/calculators.test.ts");
      expect(test).toContain("splitByPercent");
      expect(test).toContain("salaryBudget");
      expect(test).toContain("emergencyFund");
    });

    it("the 50/30/20 client uses the shared formula", () => {
      const client = read(
        "app/tools/50-30-20-budget-calculator/CalculatorClient.tsx"
      );
      expect(client).toContain('from "@/lib/calculators"');
      expect(client).toContain("splitByPercent");
    });

    it("both new clients use the shared formula library", () => {
      expect(
        read("app/tools/salary-budget-calculator/SalaryBudgetClient.tsx")
      ).toContain('from "@/lib/calculators"');
      expect(
        read("app/tools/emergency-fund-calculator/EmergencyFundClient.tsx")
      ).toContain('from "@/lib/calculators"');
    });
  });
});

// Injected into template strings above to keep the canonical assertion readable.
const SITE_ORIGIN_MARKER = "`${SITE_ORIGIN}";
