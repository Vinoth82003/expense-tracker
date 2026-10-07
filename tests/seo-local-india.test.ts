import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

function listTsx(dir: string): string[] {
  const out: string[] = [];
  if (!statSync(dir).isDirectory()) return out;
  for (const entry of readdirSync(dir, { recursive: true }) as string[]) {
    const full = path.join(dir, entry);
    if (!statSync(full).isFile()) continue;
    if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      out.push(path.relative(root, full));
    }
  }
  return out;
}

const marketingTsx = [
  ...listTsx(path.join(root, "app")),
  ...listTsx(path.join(root, "components")),
].filter(
  (f) =>
    !/\\admin\\|\\api\\|\\(authenticated)\\/.test(f) &&
    !f.endsWith("middleware.ts")
);

/**
 * Module 17 — local SEO & India search intent.
 *
 * Proves the India-first intent the product already carries (INR/rupee copy,
 * Indian financial year, Lakhs/Crores), and locks in the local-SEO stance:
 * SpendWise is a digital-only product with no physical location, so
 * LocalBusiness/GBP/PostalAddress schema, fake addresses, and low-value
 * city/salary pages are banned and must never be added.
 */

describe("India-first search intent", () => {
  it("homepage is India-first (rupee, Indian financial year, Lakhs/Crores)", () => {
    const home = read("app/page.tsx");
    expect(home).toMatch(/rupee|₹|Rs\./i);
    expect(home).toContain("Indian financial year");
    expect(home).toMatch(/Lakhs and Crores/i);
  });

  it("every free calculator uses Indian money conventions (₹/INR/rupee)", () => {
    for (const p of [
      "app/tools/50-30-20-budget-calculator/page.tsx",
      "app/tools/50-30-20-budget-calculator/CalculatorClient.tsx",
      "app/tools/salary-budget-calculator/page.tsx",
      "app/tools/salary-budget-calculator/SalaryBudgetClient.tsx",
      "app/tools/emergency-fund-calculator/EmergencyFundClient.tsx",
    ]) {
      const src = read(p);
      expect(src, p).toMatch(/INR|rupee|₹|Rs\./i);
    }
  });

  it("FAQ page, features, and how-it-works carry India context", () => {
    expect(read("app/faq/page.tsx")).toMatch(/for India|Indian financial year/i);
    expect(read("app/features/_data.ts")).toMatch(/rupee|₹/i);
    expect(read("app/how-it-works/steps.ts")).toMatch(/rupee|₹|financial year/i);
  });

  it("download metadata brands the app for India and compare pages use the Indian FY", () => {
    expect(read("app/download/page.tsx")).toContain("for India");
    for (const p of [
      "app/compare/spendwise-vs-walnut/page.tsx",
      "app/compare/spendwise-vs-et-money/page.tsx",
    ]) {
      expect(read(p)).toMatch(/financial year/i);
    }
  });
});

describe("local-business SEO does not apply (no fabricated location)", () => {
  it("no marketing surface has LocalBusiness/PostalAddress/geo schema", () => {
    const banned = [
      /"@type"\s*:\s*"LocalBusiness"/,
      /"@type"\s*:\s*"PostalAddress"/,
      /"@type"\s*:\s*"Store"/,
      /"address"\s*:/,
      /"geo"\s*:/,
      /"openingHours"/,
      /"hasMap"/,
      /"streetAddress"/,
    ];
    for (const f of marketingTsx) {
      const src = read(f);
      for (const re of banned) {
        expect(src, `${f} ${re}`).not.toMatch(re);
      }
    }
  });

  it("no mailing-address / phone-location markers (no fake NAP)", () => {
    const nap = /\d{1,4}[,\s]+(Street|Road|Avenue|Ave|Lane|Sector|Flat|Apartment)/i;
    for (const f of marketingTsx) {
      expect(read(f), f).not.toMatch(nap);
    }
  });

  it("no low-value city pages exist or are sitemapped", () => {
    const cities = [
      "pune",
      "mumbai",
      "delhi",
      "bangalore",
      "bengaluru",
      "chennai",
      "hyderabad",
      "kolkata",
      "gurgaon",
      "noida",
      "jaipur",
    ];
    for (const city of cities) {
      expect(existsSync(path.join(root, "app", city)), `${city} route`).toBe(false);
      const sitemap = read("app/sitemap.ts");
      const html = read("app/sitemap/page.tsx");
      expect(sitemap, `${city} sitemap entry`).not.toMatch(new RegExp(`/${city}/`));
      expect(html, `${city} html sitemap entry`).not.toMatch(new RegExp(`/${city}/`));
    }
  });
});

describe("India-source honesty", () => {
  it("guides do not fabricate institution citations or stats", () => {
    const guides = read("lib/docs-guides.ts");
    // No invented RBI/EPF/SBI figures masquerading as sourced data.
    // Word boundaries required: "arbitrary" contains the substring "rbi".
    expect(guides).not.toMatch(/\bRBI\b|\bEPFO\b|\bNSDL\b|\bSEBI\b|\bITD\b/);
    expect(guides).not.toMatch(/as per RBI|\bRBI (data|reports|says)\b/i);
  });

  it("module 17 audit documents the local-SEO stance and India-source policy", () => {
    const doc = read("../docs/seo/17-local-seo-and-india-search-intent-audit.md" as string);
    expect(doc).toMatch(/not applicable/i);
    expect(doc).toMatch(/no physical/i);
    expect(doc).toMatch(/city pages/i);
  });
});