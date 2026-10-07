import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("Module 05 — homepage SEO", () => {
  const layout = read("app/layout.tsx");
  const home = read("app/page.tsx");
  const hero = read("components/landing/sections/HeroSection.tsx");
  const homeClient = read("components/landing/HomeClient.tsx");

  describe("metadata (root layout serves the homepage)", () => {
    it("targets expense tracker / budget manager / India", () => {
      expect(layout).toMatch(/Expense Tracker & Budget Manager for India/);
      expect(layout).toMatch(/free AI-powered expense tracker/i);
      expect(layout).toMatch(/India/);
    });

    it("canonicalizes to / with index, follow", () => {
      expect(layout).toMatch(/canonical:\s*"\/"/);
      expect(layout).toMatch(/robots:\s*"index, follow"/);
    });

    it("declares an indexable OG image with dimensions", () => {
      expect(layout).toMatch(/width:\s*1200/);
      expect(layout).toMatch(/height:\s*630/);
    });
  });

  describe("one H1 and value proposition", () => {
    it("HeroSection is the single H1 source on the homepage", () => {
      expect(hero).toMatch(/<motion\.h1/);
      expect(hero).not.toMatch(/<motion\.h2/);
      const landingDir = path.join(root, "components/landing");
      const h1Files: string[] = [];
      const walk = (dir: string) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (/\.tsx$/.test(e.name)) {
            const src = fs.readFileSync(full, "utf8");
            if (/<h1|<motion\.h1/.test(src)) h1Files.push(full);
          }
        }
      };
      walk(landingDir);
      expect(h1Files).toHaveLength(1);
      expect(h1Files[0]).toContain("HeroSection.tsx");
    });

    it("H1 leads with the primary keyword and the subhead names India", () => {
      expect(hero).toMatch(/Expense tracker/);
      expect(hero).toMatch(/built for India/);
    });
  });

  describe("structured data + real metrics", () => {
    it("emits SoftwareApplication, FAQPage, and Organization JSON-LD", () => {
      expect(home).toContain('"@type": "SoftwareApplication"');
      expect(home).toContain('"@type": "FAQPage"');
      expect(home).toContain('"@type": "Organization"');
    });

    it("stats come from the database, not hardcoded numbers", () => {
      expect(home).toMatch(/prisma\.user\.count\(\)/);
      expect(home).toMatch(/prisma\.expense\.count\(\)/);
      expect(home).toMatch(/status:\s*"APPROVED"/);
    });

    it("organization contact point uses the support resolver", () => {
      expect(home).toContain("resolveSupportEmail()");
      expect(home).toContain("resolveSupportPhone()");
    });
  });

  describe("section coverage required by the brief", () => {
    it("homepage includes features, how-it-works, tools/resources, trust, FAQ", () => {
      expect(homeClient).toContain("FeaturesGrid");
      expect(homeClient).toContain("HowItWorksStrip");
      expect(homeClient).toContain("FreeToolsCTA");
      expect(homeClient).toContain("CounterStats");
      expect(homeClient).toContain("TestimonialsSection");
      expect(homeClient).toContain("FAQSection");
    });

    it("how-it-works strip links to the full guide", () => {
      const strip = read("components/landing/sections/HowItWorksStrip.tsx");
      expect(strip).toMatch(/href="\/how-it-works"/);
      expect(strip).toMatch(/<h2/);
    });

    it("tools section links the 50/30/20 calculator and docs guides", () => {
      const tools = read("components/landing/sections/FreeToolsCTA.tsx");
      expect(tools).toContain("/tools/50-30-20-budget-calculator");
      expect(tools).toContain("/docs/");
    });
  });

  describe("claim hygiene", () => {
    const landingFiles = [
      "components/landing/sections/FinalCTA.tsx",
      "components/landing/sections/AISection.tsx",
      "components/landing/sections/ComparisonTable.tsx",
      "components/landing/TestimonialsSection.tsx",
      "components/landing/sections/HeroSection.tsx",
      "app/page.tsx",
      "app/faq/FAQClient.tsx",
      "app/features/FeaturesClient.tsx",
    ];

    it.each(landingFiles)("%s avoids banned scale/pricing claims", (rel) => {
      const src = read(rel);
      expect(src).not.toMatch(
        /Free forever|India's #1|India's best|Join thousands|10,000\+ users/i
      );
    });

    it("no absolute AI reliability claims (zero hallucination)", () => {
      expect(read("components/landing/sections/AISection.tsx")).not.toMatch(
        /zero hallucination/i
      );
    });

    it("comparison table uses qualitative competitor cells, not invented prices", () => {
      const table = read("components/landing/sections/ComparisonTable.tsx");
      expect(table).not.toMatch(/₹500–1500/);
      expect(table).not.toMatch(/"2 min"/);
      expect(table).toMatch(/Paid tiers/);
    });
  });
});
