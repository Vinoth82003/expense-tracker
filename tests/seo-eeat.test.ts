import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STATIC_GUIDES } from "@/lib/docs-guides";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/**
 * Module 11 — E-E-A-T and trust-claim hygiene.
 *
 * These tests do NOT re-check facts other suites own (free pricing, ratings,
 * calculator disclaimers, schema parity). They enforce the Module 11 rules:
 * no fabricated certifications/awards/scale claims, no numeric support SLAs,
 * no exclusive AI-provider claims (analyze runs Groq first, Gemini fallback),
 * no absolute "data never leaves your account" contradictions, consistent
 * author identity, guide disclaimers, and synchronized policy dates.
 */

const MARKETING_SURFACES = [
  "app/page.tsx",
  "app/how-it-works/page.tsx",
  "app/how-it-works/HowItWorksClient.tsx",
  "app/features/page.tsx",
  "app/features/FeaturesClient.tsx",
  "app/features/_data.ts",
  "app/download/page.tsx",
  "app/download/DownloadClient.tsx",
  "app/reviews/page.tsx",
  "app/faq/page.tsx",
  "app/faq/FAQClient.tsx",
  "components/landing/sections/home-faqs.ts",
  "components/landing/TestimonialsSection.tsx",
  "components/landing/sections/FinalCTA.tsx",
  "components/landing/sections/AISection.tsx",
  "app/contact/ContactClient.tsx",
];

const FABRICATED_TRUST_CLAIMS: Array<[string, RegExp]> = [
  ["bank-grade security", /bank-grade/i],
  ["military-grade security", /military-grade/i],
  ["100% secure", /100% secure/i],
  ["ISO 27001 certification", /ISO\s?27001/i],
  ["PCI DSS certification", /PCI[-\s]?DSS/i],
  ["SOC 2 certification", /SOC\s?2/i],
  ["award-winning", /award-winning/i],
  ["millions of users", /millions of (users|people)/i],
  ["thousands of users", /thousands of users/i],
  ["trusted-by scale claim", /trusted by (over |more than )?\d/i],
  ["guaranteed results", /guarantee/i],
  ["unhackable / cannot be hacked", /unhackable|cannot be hacked/i],
  ["free forever", /free forever/i],
  ["#1 ranking claim", /India'?s #1|#1 (expense|money|budget) app/i],
];

describe("E-E-A-T: no fabricated trust claims", () => {
  it.each(FABRICATED_TRUST_CLAIMS)(
    "marketing surfaces contain no %s claim",
    (_label, token) => {
      for (const file of MARKETING_SURFACES) {
        const src = read(file);
        const match = src.match(token);
        expect(
          match,
          `${file} contains fabricated trust claim "${match?.[0]}"`
        ).toBeNull();
      }
    }
  );

  it("support surfaces promise no numeric response SLA", () => {
    const sla = /\bwithin 24 hours\b|\brespond(?:s)? within \d+/i;
    const slaFiles = [
      "app/faq/page.tsx",
      "app/faq/FAQClient.tsx",
      "app/contact/ContactClient.tsx",
      "components/landing/sections/home-faqs.ts",
    ];
    for (const file of slaFiles) {
      expect(sla.test(read(file)), `${file} contains an unverified SLA`).toBe(
        false
      );
    }
  });
});

describe("E-E-A-T: AI provider claims match the code", () => {
  const providerFiles = [
    "app/faq/page.tsx",
    "app/features/_data.ts",
    "app/features/page.tsx",
    "app/onboarding/page.tsx",
  ];

  it("never names Gemini exclusively (analyze is Groq-first with Gemini fallback)", () => {
    for (const file of providerFiles) {
      const src = read(file);
      const bare = src.match(/Gemini(?! or Groq)/);
      expect(
        bare,
        `${file} names Gemini without the Groq alternative: "${bare?.[0]}"`
      ).toBeNull();
    }
  });

  it("does not pin volatile model versions in user-facing copy", () => {
    for (const file of providerFiles) {
      expect(read(file), `${file} pins a model version`).not.toMatch(
        /2\.5 (Flash|Pro)/
      );
    }
  });

  it("Terms discloses every AI provider the app can call", () => {
    const terms = read("app/terms/TermsClient.tsx");
    expect(terms).toContain("Gemini AI");
    expect(terms).toContain("Groq");
  });

  it("analyze route really uses the two disclosed providers", () => {
    const analyze = read("app/api/analyze/route.ts");
    expect(analyze).toMatch(/callGroqAnalyze/);
    expect(analyze).toMatch(/gemini-2\.5-flash/);
  });
});

describe("E-E-A-T: data-sharing claims are consistent and non-absolute", () => {
  it("homepage FAQ makes no absolute non-sharing claim", () => {
    const faqs = read("components/landing/sections/home-faqs.ts");
    expect(faqs).not.toMatch(/never share it with third parties/i);
    expect(faqs).not.toMatch(/never leaves your account/i);
    expect(faqs).toContain("never sell it");
    expect(faqs).toContain("Privacy Policy");
  });

  it("/faq makes no absolute non-sharing claim", () => {
    const faq = read("app/faq/page.tsx");
    expect(faq).not.toMatch(/never leaves your account/i);
    expect(faq).not.toMatch(/never sell or share financial data with anyone/i);
    expect(faq).toContain("never sell your financial data");
  });

  it("homepage Sage AI answer avoids absolute AI-behavior guarantees", () => {
    const faqs = read("components/landing/sections/home-faqs.ts");
    expect(faqs).not.toMatch(/hallucinate/i);
    expect(faqs).toContain("check important figures");
  });

  it("privacy redaction claim is backed by lib/pii.ts", () => {
    const features = read("app/features/_data.ts");
    expect(features).toMatch(/emails, phone numbers redacted/i);
    const pii = read("lib/pii.ts");
    expect(pii).toContain("[EMAIL]");
    expect(pii).toContain("[PHONE]");
  });
});

describe("E-E-A-T: author and creator identity", () => {
  it("homepage creator uses the canonical byline with an identity URL", () => {
    const home = read("app/page.tsx");
    expect(home).toContain('"name": "Vinoth S"');
    expect(home).not.toContain('"name": "Vinoth"');
    expect(home).toContain('"url": "https://vinoths.vercel.app/"');
  });

  it("docs, footer, and terms all use the same byline", () => {
    for (const file of [
      "app/docs/[[...slug]]/page.tsx",
      "components/layout/Footer.tsx",
      "app/terms/TermsClient.tsx",
      "app/privacy/PrivacyClient.tsx",
    ]) {
      expect(read(file), `${file} byline`).toContain("Vinoth S");
    }
  });
});

describe("E-E-A-T: content disclaimers and freshness", () => {
  it("every static guide carries a financial-advice disclaimer", () => {
    expect(STATIC_GUIDES.length).toBeGreaterThanOrEqual(3);
    for (const guide of STATIC_GUIDES) {
      expect(
        guide.content,
        `${guide.slug} missing disclaimer`
      ).toContain("not financial advice");
    }
  });

  it("every static guide carries a review date", () => {
    for (const guide of STATIC_GUIDES) {
      expect(guide.content).toMatch(/\*Last reviewed: [A-Z][a-z]+ \d{4}\.\*/);
    }
  });

  it("privacy and terms visible dates match their JSON-LD dateModified", () => {
    const MONTHS: Record<string, number> = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
    };
    for (const [page, client] of [
      ["app/privacy/page.tsx", "app/privacy/PrivacyClient.tsx"],
      ["app/terms/page.tsx", "app/terms/TermsClient.tsx"],
    ]) {
      const modified = read(page).match(/dateModified: "(\d{4})-(\d{2})-/);
      const visible = read(client).match(/Last Updated: (\w+) (\d{4})/);
      expect(modified, `${page} dateModified`).not.toBeNull();
      expect(visible, `${client} Last Updated`).not.toBeNull();
      expect(Number(modified![2])).toBe(MONTHS[visible![1]]);
      expect(modified![1]).toBe(visible![2]);
    }
  });
});

describe("E-E-A-T: testimonials are real, approved reviews", () => {
  it("homepage testimonials render only APPROVED reviews from the API", () => {
    const section = read("components/landing/TestimonialsSection.tsx");
    expect(section).toContain('fetch("/api/reviews")');
    expect(section).not.toMatch(/name: "/);
    expect(read("app/api/reviews/route.ts")).toContain('status: "APPROVED"');
  });

  it("reviews page renders only APPROVED reviews", () => {
    expect(read("app/reviews/page.tsx")).toContain('status: "APPROVED"');
  });
});
