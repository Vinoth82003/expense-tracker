import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const exists = (p: string) => statSync(path.join(root, p)).isFile();

/**
 * Module 16 — backlink strategy & digital PR infrastructure.
 *
 * Guards the new `/press` press-kit asset: metadata + OG resolution, its wiring
 * across robots/sitemap/footer/html-sitemap/contact (so it is neither orphaned
 * nor blocked), factual hygiene (no invented history/reach/contact), and the
 * strategy doc's hard ban on PBNs/link farms/paid links plus its honest
 * zero-earned-links baseline. It never asserts a placement count — earned links
 * are recorded only by a human operator in the audit doc's log.
 */

describe("press kit page", () => {
  const press = read("app/press/page.tsx");

  it("is a canonical, indexed marketing page with title/description", () => {
    expect(press).toContain('canonical: "/press"');
    expect(press).toContain('title: "Press Kit | SpendWise');
    expect(press).toMatch(/description:\s*\n?\s*"Press and media kit/);
  });

  it("OG image resolves to a real file and twitter card pairs with it", () => {
    expect(exists("public/og-images/og-home-dark.png")).toBe(true);
    expect(press).toMatch(/url: "\/og-images\/og-home-dark\.png"/);
    expect(press).toMatch(/images: \["\/og-images\/og-home-dark\.png"\]/);
  });

  it("ships media assets that exist on disk", () => {
    for (const asset of ["app/icon0.svg", "app/icon1.png", "public/og-images/og-home-dark.png"]) {
      expect(exists(asset), asset).toBe(true);
    }
  });

  it("quick facts are sourced and pricing claim is the canonical one", () => {
    expect(press).toContain("Free for personal use");
    // 7 rendered facts each carry a "Source:" line and a `source:` entry.
    expect(press).toContain("Source: {source}");
    expect((press.match(/source:/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});

describe("press wiring (robots, sitemap, linking)", () => {
  it("robots allows /press; sitemap declares it with a fixed lastmod", () => {
    expect(read("app/robots.ts")).toContain('"/press"');
    const sitemap = read("app/sitemap.ts");
    expect(sitemap).toContain('"/press": "2026-10-06"');
    expect(sitemap).toContain('staticRoute(baseUrl, "/press"');
  });

  it("footer, html sitemap, and /contact all link /press (no orphan)", () => {
    expect(read("components/layout/Footer.tsx")).toContain('{ label: "Press Kit", href: "/press" }');
    expect(read("app/sitemap/page.tsx")).toContain('href: "/press"');
    expect(read("app/contact/ContactClient.tsx")).toContain('href="/press"');
  });
});

describe("press factual hygiene", () => {
  const press = read("app/press/page.tsx");

  it("makes no fabricated claims (history, reach, awards, placements)", () => {
    const banned = [
      /featured in/i,
      /as seen on/i,
      /million (users|downloads)/i,
      /\brevenue\b/i,
      /award/i,
      /founded in/i,
      /\b(users|downloads):\s*\d+/i,
    ];
    for (const re of banned) {
      expect(press, re.toString()).not.toMatch(re);
    }
  });

  it("directs contact through /contact instead of an invented email", () => {
    expect(press).not.toMatch(/mailto:/);
    expect(press).toContain('href="/contact"');
  });
});

describe("backlink strategy doc", () => {
  const doc = read("../docs/seo/16-backlink-strategy-and-digital-pr-audit.md");

  it("bans PBNs, link farms, and paid links; outreach is human-only", () => {
    expect(doc).toMatch(/PBN/i);
    expect(doc).toMatch(/link farm/i);
    expect(doc).toMatch(/paid links/i);
    expect(doc).toMatch(/human/i);
  });

  it("documents honest, no-fabrication reporting and the unlinked-mention workflow", () => {
    expect(doc).toMatch(/unlinked-mention/i);
    expect(doc).toContain("0 earned links");
    // A strategy doc must not pretend to already own backlinks.
    expect(doc).not.toMatch(/\d+\s*(referring domains|backlinks)\s*(=|owned)/i);
  });

  it("inventories the real linkable assets (calculators, compare, press)", () => {
    for (const asset of [
      "50/30/20 Budget Calculator",
      "Salary Budget Calculator",
      "Emergency Fund Calculator",
      "/compare/spendwise-vs-walnut",
      "/press",
      "/docs/50-30-20-budgeting-guide",
    ]) {
      expect(doc, asset).toContain(asset);
    }
  });
});