import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/**
 * Module 12 — page-speed hygiene (static, code-level).
 *
 * Lab/field metrics (LCP, INP, CLS, TTFB) are NOT asserted here — they must
 * be measured by Lighthouse/CrUX (owner runbook in
 * docs/seo/12-page-speed-and-core-web-vitals-audit.md). These tests enforce
 * the rendering and caching decisions that determine those metrics:
 * self-hosted fonts with swap, no dead font connections, async third-party
 * scripts, image optimization, corrected cache rules, and no raw <img> tags
 * on marketing surfaces.
 */

function listFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { recursive: true }) as string[]) {
    const full = path.join(dir, entry);
    if (!statSync(full).isFile()) continue;
    if (exts.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

describe("critical rendering path", () => {
  it("uses next/font (self-hosted) with display swap for both fonts", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain('from "next/font/google"');
    const swaps = layout.match(/display: "swap"/g) ?? [];
    expect(swaps.length).toBeGreaterThanOrEqual(2);
  });

  it("loads no external font stylesheet anywhere in styles or components", () => {
    const files = [
      ...listFiles(path.join(root, "app"), [".css", ".tsx", ".ts"]),
      ...listFiles(path.join(root, "components"), [".css", ".tsx"]),
    ];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(
        src,
        `${path.relative(root, file)} loads an external font stylesheet`
      ).not.toMatch(/fonts\.googleapis\.com\/css|@import\s+url\(https?:/);
    }
  });

  it("keeps no preconnects to the unused Google Fonts origins", () => {
    const layout = read("app/layout.tsx");
    expect(layout).not.toContain('href="https://fonts.googleapis.com"');
    expect(layout).not.toContain('href="https://fonts.gstatic.com"');
  });

  it("keeps the origins it does use preconnected (Google OAuth)", () => {
    expect(read("app/layout.tsx")).toContain(
      'rel="preconnect" href="https://accounts.google.com"'
    );
  });
});

describe("third-party scripts", () => {
  it("loads Google Analytics asynchronously", () => {
    expect(read("app/layout.tsx")).toContain(
      '<script async src="https://www.googletagmanager.com'
    );
  });

  it("every absolute-URL script in the root layout is async or deferred", () => {
    const layout = read("app/layout.tsx");
    const tags = layout.match(/<script[^>]*src="https?:\/\/[^"]+"[^>]*>/g) ?? [];
    expect(tags.length).toBeGreaterThanOrEqual(1);
    for (const tag of tags) {
      expect(
        tag,
        `render-blocking third-party script: ${tag}`
      ).toMatch(/\s(async|defer)/);
    }
  });

  it("keeps the sync theme-init script tiny (budget 1 kB)", () => {
    const size = statSync(path.join(root, "public/js/theme-init.js")).size;
    expect(size).toBeLessThan(1024);
  });

  it("defers the PWA prompt script", () => {
    expect(read("app/layout.tsx")).toMatch(
      /<script src="\/js\/pwa-prompt\.js" defer/
    );
  });
});

describe("images", () => {
  it("serves modern formats with a long edge cache TTL", () => {
    const config = read("next.config.ts");
    expect(config).toContain('formats: ["image/avif", "image/webp"]');
    expect(config).toContain("minimumCacheTTL: 60 * 60 * 24 * 30");
  });

  it("homepage testimonial avatars go through the image optimizer", () => {
    const section = read("components/landing/TestimonialsSection.tsx");
    expect(section).toContain("<Image");
    expect(section).not.toContain("unoptimized");
  });

  it("marketing surfaces use next/image — no raw <img> tags", () => {
    const dirs = [
      "components/landing",
      "app/features",
      "app/how-it-works",
      "app/faq",
      "app/download",
      "app/contact",
      "app/reviews",
      "app/compare",
    ];
    for (const dir of dirs) {
      for (const file of listFiles(path.join(root, dir), [".tsx"])) {
        const src = readFileSync(file, "utf8");
        expect(
          src,
          `${path.relative(root, file)} uses a raw <img> tag`
        ).not.toContain("<img ");
      }
    }
  });
});

describe("caching", () => {
  const config = read("next.config.ts");

  it("applies the marketing cache rule to multi-segment tool and compare routes", () => {
    expect(config).toContain('source: "/tools/:path*"');
    expect(config).toContain('source: "/compare/:path*"');
  });

  it("lists marketing routes explicitly instead of matching every single-segment page", () => {
    expect(config).toContain('"/(features|how-it-works|faq|download|');
    expect(config).not.toContain(":path(features|");
  });

  it("keeps CDN cache + stale-while-revalidate on marketing rules", () => {
    const count = (
      config.match(/s-maxage=3600, stale-while-revalidate=86400/g) ?? []
    ).length;
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it("registers the service worker for repeat-visit performance", () => {
    expect(config).toContain("withPWA");
    expect(config).toMatch(/register: true/);
  });
});
