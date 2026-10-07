import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { HOME_FAQS } from "@/components/landing/sections/home-faqs";
import { faqs as featureFaqs } from "@/app/features/_data";
import { steps as howItWorksSteps } from "@/app/how-it-works/steps";
import { STATIC_GUIDES } from "@/lib/docs-guides";

// ---------------------------------------------------------------------------
// Module 10 — JSON-LD accuracy.
// The brief's rules made testable: FAQPage only for visible FAQs (built from
// the same source the page renders), HowTo/ItemList parity, WebSite +
// Organization @id linking, no fabricated dates/ratings/durations, and every
// emitted graph serialised with JSON.stringify (parseable).
// ---------------------------------------------------------------------------

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith("."))
      continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

const rel = (file: string) => path.relative(root, file).replace(/\\/g, "/");

describe("Module 10 — JSON-LD accuracy", () => {
  describe("homepage", () => {
    const home = read("app/page.tsx");

    it("emits SoftwareApplication, FAQPage, Organization, and WebSite", () => {
      for (const type of ["SoftwareApplication", "FAQPage", "Organization", "WebSite"]) {
        expect(home).toContain(`"@type": "${type}"`);
      }
    });

    it("WebSite and Organization are @id-linked (publisher references)", () => {
      expect(home).toContain("/#website");
      expect(home).toContain("/#organization");
      // @id assignment + at least one publisher reference to the org @id.
      expect(home.split("/#organization").length - 1).toBeGreaterThanOrEqual(2);
      expect(home).toContain('"@id": `${baseUrl}/#organization`');
    });

    it("SoftwareApplication is free (price 0 INR) and carries no ratings", () => {
      expect(home).toContain('"price": "0"');
      expect(home).toContain('"priceCurrency": "INR"');
      expect(home).not.toContain("aggregateRating");
      expect(home).not.toContain("ratingValue");
    });

    it("Organization contact email is env-resolved, not hardcoded", () => {
      expect(home).toContain("resolveSupportEmail()");
      expect(home).not.toMatch(/"email":\s*"[^"]+@[^"]+"/);
    });

    it("FAQPage is generated from HOME_FAQS (the visible accordion source)", () => {
      expect(home).toContain("HOME_FAQS.map");
      // The DB FAQ table must not feed schema-only questions again.
      expect(home).not.toContain("prisma.fAQ");
    });

    it("HOME_FAQS matches what FAQSection renders", () => {
      const section = read("components/landing/sections/FAQSection.tsx");
      expect(section).toContain('HOME_FAQS } from "./home-faqs"');
      expect(HOME_FAQS.length).toBeGreaterThanOrEqual(6);
      for (const faq of HOME_FAQS) {
        expect(faq.q.length).toBeGreaterThan(0);
        expect(faq.a.length).toBeGreaterThan(0);
      }
    });
  });

  describe("features page", () => {
    const features = read("app/features/page.tsx");

    it("FAQPage is generated from the visible _data.faqs array", () => {
      expect(features).toContain('from "./_data"');
      expect(features).toContain("faqs.map");
    });

    it("feature FAQ data is non-empty and surfaced in FeaturesClient", () => {
      expect(featureFaqs.length).toBeGreaterThanOrEqual(6);
      const client = read("app/features/FeaturesClient.tsx");
      expect(client).toContain('from "./_data"');
      expect(client).toContain("faqs.map");
    });

    it("ItemList describes the six visible features", () => {
      expect(features).toContain('"@type": "ItemList"');
      const items = features.match(/"?(position)"?: \d+/g) ?? [];
      expect(items.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("how-it-works page", () => {
    const hiw = read("app/how-it-works/page.tsx");

    it("HowTo is generated from the shared visible steps", () => {
      expect(hiw).toContain("steps.map");
      expect(read("app/how-it-works/HowItWorksClient.tsx")).toContain(
        'from "./steps"'
      );
    });

    it("no fabricated duration claim (totalTime removed)", () => {
      expect(hiw).not.toContain("totalTime");
    });

    it("shared steps are complete", () => {
      expect(howItWorksSteps.length).toBe(4);
      for (const step of howItWorksSteps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.bullets.length).toBeGreaterThan(0);
      }
    });
  });

  describe("faq page", () => {
    const faq = read("app/faq/page.tsx");

    it("FAQPage questions are exactly the list rendered by FAQClient", () => {
      expect(faq).toContain('"mainEntity": faqs.map');
      expect(faq).toContain("<FAQClient faqs={faqs} />");
    });
  });

  describe("docs TechArticle dates", () => {
    const docs = read("app/docs/[[...slug]]/page.tsx");

    it("no fabricated or request-time fallback dates", () => {
      expect(docs).not.toContain("2024-05-01");
      expect(docs).not.toContain("|| new Date()");
      expect(docs).toContain("datePublished ? { datePublished }");
      expect(docs).toContain("dateModified ? { dateModified }");
    });

    it("every static guide carries a fixed real publication date", () => {
      expect(STATIC_GUIDES.length).toBeGreaterThanOrEqual(3);
      for (const guide of STATIC_GUIDES) {
        expect(guide.createdAt).toBeTruthy();
        expect(guide.updatedAt).toBeTruthy();
        expect(new Date(guide.createdAt!).toISOString()).toMatch(
          /^2026-10-06/
        );
      }
    });
  });

  describe("reviews schema integrity", () => {
    it("aggregateRating exists only on the reviews page", () => {
      const offenders = [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))]
        .filter((f) => fs.readFileSync(f, "utf8").includes("aggregateRating"))
        .map(rel);
      expect(offenders).toEqual(["app/reviews/page.tsx"]);
    });

    it("rating markup is conditional on rendered reviews", () => {
      const reviews = read("app/reviews/page.tsx");
      expect(reviews).toContain("hasRenderableReviews");
      expect(reviews).toContain("reviewStructuredData && (");
    });
  });

  describe("serialization hygiene", () => {
    it("every application/ld+json emission uses JSON.stringify (parseable)", () => {
      const offenders: string[] = [];
      for (const file of walk(path.join(root, "app"))) {
        const src = fs.readFileSync(file, "utf8");
        if (!src.includes("application/ld+json")) continue;
        if (!src.includes("JSON.stringify(")) offenders.push(rel(file));
      }
      expect(offenders).toEqual([]);
    });
  });
});
