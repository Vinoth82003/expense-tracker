import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

/** Marketing pages that declare their own metadata title. */
const MARKETING_TITLES: [page: string, file: string][] = [
  ["home (layout)", "app/layout.tsx"],
  ["features", "app/features/page.tsx"],
  ["how-it-works", "app/how-it-works/page.tsx"],
  ["faq", "app/faq/page.tsx"],
  ["reviews", "app/reviews/page.tsx"],
  ["download", "app/download/page.tsx"],
  ["contact", "app/contact/page.tsx"],
  ["privacy", "app/privacy/page.tsx"],
  ["terms", "app/terms/page.tsx"],
  ["sitemap", "app/sitemap/page.tsx"],
  ["compare walnut", "app/compare/spendwise-vs-walnut/page.tsx"],
  ["compare et-money", "app/compare/spendwise-vs-et-money/page.tsx"],
  ["tool 50-30-20", "app/tools/50-30-20-budget-calculator/page.tsx"],
];

describe("Module 06 — keyword strategy invariants", () => {
  describe("title uniqueness (cannibalization guard)", () => {
    const titles = MARKETING_TITLES.map(([label, file]) => {
      const src = read(file);
      const m = src.match(/title:\s*"([^"]+)"/);
      expect(m, `${file} must declare a title`).toBeTruthy();
      return { label, title: m![1] };
    });

    it("every marketing title is unique", () => {
      const seen = new Map<string, string>();
      const dupes: string[] = [];
      for (const { label, title } of titles) {
        if (seen.has(title)) dupes.push(`${label} = ${seen.get(title)}`);
        seen.set(title, label);
      }
      expect(dupes).toEqual([]);
    });
  });

  describe("keyword → URL mapping (evidence in titles)", () => {
    it("head cluster: homepage title owns expense tracker + budget manager + India", () => {
      const layout = read("app/layout.tsx");
      expect(layout).toMatch(/Expense Tracker & Budget Manager for India/);
    });

    it("budgeting tool URL matches its calculator keyword", () => {
      const tool = read("app/tools/50-30-20-budget-calculator/page.tsx");
      expect(tool).toMatch(/50\/30\/20 Budget Calculator/);
      expect(tool).toMatch(/canonical:\s*"\/tools\/50-30-20-budget-calculator"/);
    });

    it("comparison URLs use one-competitor-per-URL keyword pattern", () => {
      const walnut = read("app/compare/spendwise-vs-walnut/page.tsx");
      const et = read("app/compare/spendwise-vs-et-money/page.tsx");
      expect(walnut).toMatch(/SpendWise vs Walnut/);
      expect(et).toMatch(/SpendWise vs ET Money/);
    });

    it("how-it-works is the navigational title for the process cluster", () => {
      const hiw = read("app/how-it-works/page.tsx");
      expect(hiw).toMatch(/title:\s*"How It Works \|/);
      expect(hiw).toMatch(/canonical:\s*"\/how-it-works"/);
    });

    it("features page keeps its cluster title distinct from the head", () => {
      const features = read("app/features/page.tsx");
      expect(features).toMatch(/title:\s*"Features \|/);
      expect(features).toMatch(/canonical:\s*"\/features"/);
    });
  });

  describe("claim hygiene across public surfaces", () => {
    const dirs = [path.join(root, "app"), path.join(root, "components/landing")];

    function walk(dir: string, out: string[] = []): string[] {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (
          e.name === "node_modules" ||
          e.name === ".next" ||
          e.name.startsWith(".")
        )
          continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full, out);
        else if (/\.tsx?$/.test(e.name)) out.push(full);
      }
      return out;
    }

    it("no fabricated scale claims (Thousands of users etc.) in app or landing", () => {
      const offenders: string[] = [];
      const files = [...walk(dirs[0]), ...walk(dirs[1])];
      for (const file of files) {
        // Admin/authenticated API internals may legitimately quote limits;
        // restrict to public page/component sources.
        const rel = path.relative(root, file).replace(/\\/g, "/");
        if (rel.startsWith("app/admin/") || rel.startsWith("app/api/")) continue;
        if (/\(authenticated\)/.test(rel)) continue;
        const src = fs.readFileSync(file, "utf8");
        if (/Thousands of (Indians|users|happy)/i.test(src)) offenders.push(rel);
      }
      expect(offenders).toEqual([]);
    });

    it("reviews page has no scale claim in its hero subcopy", () => {
      const reviews = read("app/reviews/ReviewsClient.tsx");
      expect(reviews).not.toMatch(/Thousands of/i);
      expect(reviews).toMatch(/Real stories from people across India/);
    });
  });

  describe("clusters present in internal navigation (module 04 handoff)", () => {
    it("footer exposes tracking, tool, compare, reviews, and docs clusters", () => {
      const footer = read("components/layout/Footer.tsx");
      for (const href of [
        "/features",
        "/tools/50-30-20-budget-calculator",
        "/compare/spendwise-vs-walnut",
        "/compare/spendwise-vs-et-money",
        "/reviews",
        "/docs",
      ]) {
        expect(footer).toContain(`"${href}"`);
      }
    });
  });
});
