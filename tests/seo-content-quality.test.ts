import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { STATIC_GUIDES } from "@/lib/docs-guides";

// ---------------------------------------------------------------------------
// Module 18 — content quality, topical authority & programmatic SEO.
//
// Locks in the content-quality gates: thin-content floor for guides, sourced
// attribution (no unnamed authorities), cluster cannibalization checks
// (distinct keyphrases per indexable page), bounded hubs/rosters, exactly one
// marketing catch-all template, no location/salary mass-generation routes,
// and the module-18 audit doc itself.
// ---------------------------------------------------------------------------

const root = path.resolve(__dirname, "..");

function read(p: string): string {
  return fs.readFileSync(path.join(root, p), "utf8");
}

function dirNames(p: string): string[] {
  return fs
    .readdirSync(path.join(root, p), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function countWords(md: string): number {
  let t = md
    .replace(/\*Last reviewed:[^\n]*/g, " ")
    .replace(/\*General educational[^\n]*/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  t = t.replace(/[#*_`|[\]>\-]+/g, " ").replace(/\s+/g, " ").trim();
  return t.split(" ").filter((w) => /[A-Za-z0-9₹]/.test(w)).length;
}

// Estimated thin-content floor (observed 329–391 words per guide on 2026-10-06).
const GUIDE_MIN_WORDS = 300;

const AUTHORITY_PHRASE = /as per|according to|research (says|shows)|studies (say|show)|sources say/i;

function marketingDynamicTemplates(): string[] {
  const out: string[] = [];
  const scan = (base: string) => {
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (["admin", "api", "(authenticated)", "groups", "onboarding"].includes(e.name)) continue;
      const full = path.join(base, e.name);
      if (/[\[\]]/.test(e.name) && fs.existsSync(path.join(full, "page.tsx"))) {
        out.push(path.relative(root, full));
      }
      scan(full);
    }
  };
  scan(path.join(root, "app"));
  return out;
}

function metadataTitle(...relParts: string[]): string {
  const src = read(path.join(...relParts));
  const m = src.match(/title:\s*"([^"]+)"/);
  if (!m) throw new Error(`no metadata.title in ${relParts.join("/")}`);
  return m[1];
}

describe("Module 18 — content quality & topical authority", () => {
  describe("thin-content gate", () => {
    it.each(STATIC_GUIDES.map((g) => [g.slug, g] as const))(
      "%s clears the word floor (≥ %d) and is substantive, not thin",
      (_slug, guide, floor = GUIDE_MIN_WORDS) => {
        expect(countWords(guide.content), guide.slug).toBeGreaterThanOrEqual(floor);
      }
    );

    it("tools and compare hubs are bounded, data-driven rosters (no mass-generation)", () => {
      expect(dirNames("app/tools")).toEqual([
        "50-30-20-budget-calculator",
        "emergency-fund-calculator",
        "salary-budget-calculator",
      ]);
      expect(dirNames("app/compare")).toEqual([
        "spendwise-vs-et-money",
        "spendwise-vs-walnut",
      ]);
      const toolsHub = read("app/tools/page.tsx");
      for (const href of [
        "/tools/50-30-20-budget-calculator",
        "/tools/salary-budget-calculator",
        "/tools/emergency-fund-calculator",
      ]) {
        expect(toolsHub).toContain(href);
      }
    });
  });

  describe("programmatic SEO quality gate", () => {
    it("docs/[[...slug]] is the ONLY marketing catch-all template", () => {
      expect(marketingDynamicTemplates()).toEqual([
        path.join("app", "docs", "[[...slug]]"),
      ]);
    });

    it("no location/salary mass-generation routes exist", () => {
      for (const marker of ["salaries", "salary-by-city", "city-pages", "in-mumbai", "in-delhi", "per-city"]) {
        expect(fs.existsSync(path.join(root, "app", marker)), marker).toBe(false);
      }
      const appDirs = dirNames("app");
      expect(appDirs.some((d) => /^in-[a-z]+$/.test(d))).toBe(false);
    });
  });

  describe("cluster cannibalization (distinct keyphrases)", () => {
    it("every indexable marketing page owns a unique title", () => {
      const titles = [
        ...STATIC_GUIDES.map((g) => g.title),
        metadataTitle("app", "tools", "50-30-20-budget-calculator", "page.tsx"),
        metadataTitle("app", "tools", "salary-budget-calculator", "page.tsx"),
        metadataTitle("app", "tools", "emergency-fund-calculator", "page.tsx"),
        metadataTitle("app", "tools", "page.tsx"),
        metadataTitle("app", "compare", "spendwise-vs-walnut", "page.tsx"),
        metadataTitle("app", "compare", "spendwise-vs-et-money", "page.tsx"),
        metadataTitle("app", "features", "page.tsx"),
        metadataTitle("app", "how-it-works", "page.tsx"),
        metadataTitle("app", "faq", "page.tsx"),
        metadataTitle("app", "press", "page.tsx"),
      ];
      expect(new Set(titles).size).toBe(titles.length);
    });

    it("the budgeting cluster pages are complementary, not competing", () => {
      const tool = metadataTitle("app", "tools", "50-30-20-budget-calculator", "page.tsx");
      const ruleGuide = STATIC_GUIDES.find((g) => g.slug === "50-30-20-budgeting-guide")!.title;
      const monthlyGuide = STATIC_GUIDES.find((g) => g.slug === "monthly-budgeting-guide")!.title;
      const all = [tool, ruleGuide, monthlyGuide];
      expect(new Set(all).size).toBe(3);
      expect(tool).toMatch(/50\/30\/20/i);
      expect(ruleGuide).toMatch(/50[/\\]30[/\\]20|\b50\/30\/20\b/i);
      expect(monthlyGuide).toMatch(/Monthly Budget/i);
      expect(ruleGuide).not.toBe(monthlyGuide);
    });
  });

  describe("financial-claim & source hygiene", () => {
    it("attributed methodology claims always carry a Sources section", () => {
      for (const guide of STATIC_GUIDES) {
        if (/popularis|origin of|developed by/i.test(guide.content)) {
          expect(guide.content, guide.slug).toContain("## Sources");
        }
      }
    });

    it("no guide cites an unnamed authority without sources", () => {
      for (const guide of STATIC_GUIDES) {
        if (AUTHORITY_PHRASE.test(guide.content)) {
          expect(guide.content, guide.slug).toContain("## Sources");
        }
      }
      for (const guide of STATIC_GUIDES) {
        expect(guide.content, guide.slug).not.toMatch(/as per the (RBI|EPFO|SEBI|ITD)|according to the (RBI|EPFO|SEBI|ITD)/i);
      }
    });

    it("percentage rules are always explained or sourced", () => {
      for (const guide of STATIC_GUIDES) {
        if (/%/.test(guide.content)) {
          const labelled =
            /example|illustrative|rule|% of|\d+% (goes|should go|spend)/i.test(guide.content) ||
            guide.content.includes("## Sources");
          expect(labelled, guide.slug).toBe(true);
        }
      }
    });
  });

  describe("sources & updates maintained", () => {
    it("every guide states a review date and the educational disclaimer", () => {
      for (const guide of STATIC_GUIDES) {
        expect(guide.content, guide.slug).toMatch(/\*Last reviewed: [A-Z][a-z]+ \d{4}\.\*/);
        expect(guide.content, guide.slug).toMatch(/General educational information for Indian households — not financial advice\./);
      }
    });
  });

  describe("audit doc", () => {
    it("module 18 audit documents inventory, clusters, and the programmatic policy", () => {
      const doc = read("../docs/seo/18-content-quality-topical-authority-and-programmatic-seo-audit.md" as string);
      expect(doc).toMatch(/inventory|23 public marketing route/i);
      expect(doc).toMatch(/cannibalization/i);
      expect(doc).toMatch(/programmatic/i);
      expect(doc).toMatch(/prune/i);
    });
  });
});