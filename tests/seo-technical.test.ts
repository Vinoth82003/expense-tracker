import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Module 03 — technical SEO invariants: security headers, heading hierarchy,
// internal link coverage (orphans), OG date format, claim hygiene, soft-404
// machinery, image/alt patterns that affect crawl quality.
// ---------------------------------------------------------------------------

const clientRoot = path.join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(path.join(clientRoot, ...rel.split("/")), "utf8");
}

describe("security headers (next.config)", () => {
  const config = read("next.config.ts");

  it("sets HSTS, frame, content-type and referrer policies", () => {
    expect(config).toContain("Strict-Transport-Security");
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("X-Content-Type-Options");
    expect(config).toContain("Referrer-Policy");
  });

  it("keeps frame-ancestors and object-src in CSP", () => {
    expect(config).toContain("frame-ancestors 'self'");
    expect(config).toContain("object-src 'none'");
  });
});

describe("heading hierarchy on indexable marketing pages", () => {
  const pages = [
    "components/landing/sections/HeroSection.tsx",
    "app/privacy/PrivacyClient.tsx",
    "app/terms/TermsClient.tsx",
    "app/how-it-works/HowItWorksClient.tsx",
    "app/features/FeaturesClient.tsx",
    "app/faq/FAQClient.tsx",
    "app/reviews/ReviewsClient.tsx",
    "app/download/DownloadClient.tsx",
    "app/contact/ContactClient.tsx",
    "app/compare/CompareClient.tsx",
    "app/status/page.tsx",
    "app/sitemap/page.tsx",
    "components/docs/DocsListingPage.tsx",
  ];

  it.each(pages)("%s exposes an h1", (rel) => {
    const src = read(rel);
    expect(src).toMatch(/<(\s*)h1[\s>]|<motion\.h1[\s>]/);
  });
});

describe("internal link coverage (footer vs sitemap)", () => {
  const footer = read("components/layout/Footer.tsx");
  const sitemap = read("app/sitemap.ts");

  const staticPaths = [...sitemap.matchAll(/"\/[^"]+"/g)]
    .map((m) => m[0].slice(1, -1))
    .filter((p) => p !== "/" && !p.startsWith("/docs"));

  it("every static sitemap route is reachable from the footer", () => {
    const missing = staticPaths.filter(
      (p) => !footer.includes(`href="${p}"`) && !footer.includes(`href: "${p}"`)
    );
    expect(missing).toEqual([]);
  });

  it("footer has no raw <a> internal navigation (should be Link)", () => {
    expect(footer).not.toMatch(/<a\s[^>]*href="\/(?!\/)/);
  });
});

describe("docs article Open Graph dates", () => {
  const docsPage = read("app/docs/[[...slug]]/page.tsx");

  it("uses ISO-8601 for publishedTime/modifiedTime, not Date.toString()", () => {
    expect(docsPage).toContain("toISOString()");
    expect(docsPage).not.toMatch(/publishedTime:.*\.toString\(\)/);
    expect(docsPage).not.toMatch(/modifiedTime:.*\.toString\(\)/);
  });

  it("still hard-404s unknown slugs (no soft 404)", () => {
    expect(docsPage).toMatch(/notFound\(\)/);
    expect(docsPage).toMatch(/robots:\s*\{\s*index:\s*false/);
  });
});

describe("claim hygiene on crawlable + auth shells", () => {
  const onboarding = read("app/onboarding/page.tsx");
  const home = read("components/landing/sections/HeroSection.tsx");

  it("onboarding trust chips avoid fabricated scale/security claims", () => {
    expect(onboarding).not.toContain("10,000+ users");
    expect(onboarding).not.toContain("Bank-grade security");
    expect(onboarding).not.toContain("Free forever");
  });

  it("homepage hero does not use ranking/scale superlatives", () => {
    expect(home).not.toMatch(/India's #1|India's best|Join thousands/i);
  });
});

describe("public stats source", () => {
  it("homepage counters are fed from server-side DB aggregates, not hardcoded", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("prisma.user.count()");
    expect(page).toContain("prisma.expense.count()");
  });
});

describe("image asset presence", () => {
  it("ships OG home image referenced by root metadata", () => {
    expect(existsSync(path.join(clientRoot, "public", "og-images", "og-home-dark.png"))).toBe(true);
  });

  it("ships avatar pattern with explicit dimensions when remote avatars render", () => {
    const testimonials = read("components/landing/TestimonialsSection.tsx");
    expect(testimonials).toMatch(/alt=\{`\$\{name\}'s avatar`\}/);
    expect(testimonials).toMatch(/width=\{40\}/);
    expect(testimonials).toMatch(/height=\{40\}/);
  });
});
