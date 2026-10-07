import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { STATIC_GUIDE_SLUGS } from "@/lib/docs-guides";

// ---------------------------------------------------------------------------
// Module 09 — internal linking.
// Enforces the link-graph audit: no broken static hrefs, no contextual
// orphans among marketing routes, the cross-cluster edges (homepage ↔ tools
// ↔ guides ↔ comparisons), anchor hygiene (no repeated exact-match anchors),
// no hidden links, and click depth ≤ 2 via footer/HTML sitemap.
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

const sourceFiles = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "lib")),
];

const rel = (file: string) => path.relative(root, file).replace(/\\/g, "/");

// ── Route inventory derived from the filesystem ──────────────────────────────
// Parenthesised segments (route groups like `(authenticated)`) do not appear
// in the URL; `[param]` / `[[...slug]]` segments match any input segment.
type Pattern = string[];

function routePatterns(): Pattern[] {
  const patterns: Pattern[] = [];
  const pages = [
    ...walk(path.join(root, "app")).filter((f) =>
      /(page|route)\.(tsx?|ts)$/.test(path.basename(f))
    ),
  ];
  for (const page of pages) {
    const relPath = path.relative(path.join(root, "app"), page);
    const segments = relPath.split(path.sep);
    const file = segments.pop()!;
    if (file === "route.ts" || file === "route.tsx") {
      // API routes: not navigation targets, but allow /api/ hrefs.
      patterns.push(["api", ...segments.filter((s) => !/^\(.*\)$/.test(s))]);
      continue;
    }
    const routeSegs = segments.filter((s) => !/^\(.*\)$/.test(s));
    patterns.push(routeSegs);
  }
  // app/page.tsx → root
  patterns.push([]);
  return patterns;
}

const PATTERNS = routePatterns();

function matches(pattern: Pattern, hrefSegs: string[]): boolean {
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p.startsWith("[[...") || p.startsWith("[...")) return true; // rest matches all
    if (hrefSegs[i] === undefined) return false;
    if (p.startsWith("[")) continue; // single dynamic segment
    if (p !== hrefSegs[i]) return false;
  }
  return hrefSegs.length === pattern.length;
}

function isRoutable(href: string): boolean {
  const segs = href.split("/").filter(Boolean);
  return PATTERNS.some((p) => matches(p, segs));
}

// ── DB-published docs that source code may link to ──────────────────────────
// Everything outside this set must be a repo guide or a seed slug — a wrong
// /docs/<slug> href is a 404 the router cannot catch (catch-all route).
const SEED_DOC_SLUGS = new Set(
  [...read("prisma/seed.ts").matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
);
// Production-verified DB docs (served on 2026-10-06), linked from homepage
// and the in-app chatbot. Not in seed.ts — the admin console created them.
const PRODUCTION_DOC_SLUGS = new Set([
  "sage-ai-the-spendwise-chatbot",
  "sage-ai-query-guide",
]);
const KNOWN_DOC_SLUGS = new Set([
  ...SEED_DOC_SLUGS,
  ...PRODUCTION_DOC_SLUGS,
  ...STATIC_GUIDE_SLUGS,
]);

// ── Static href extraction ──────────────────────────────────────────────────
const HREF_RE =
  /href=["'`]([^"'`$}]+)["'`]|href:\s*["']([^"']+)["']|\]\((\/[^)#\s]+)\)/g;

function staticHrefs(src: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(HREF_RE.source, "g");
  while ((m = re.exec(src)) !== null) {
    const href = m[1] || m[2] || m[3];
    if (href) out.push(href);
  }
  return out;
}

// Files whose hrefs are comments/placeholders, not navigation.
const COMMENT_LITERAL_FILES = new Set([
  "components/chat/ChatPanel.tsx", // "[label](/path)" examples in comments
  "lib/chat/v2/inline-links.ts", // parser doc examples
]);

const NON_ROUTE_TARGETS = new Set([
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/manifest.json",
  "/sw.js",
]);

function targetExists(href: string): boolean {
  const clean = href.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  if (clean === "/") return true;
  if (NON_ROUTE_TARGETS.has(clean)) return true;
  if (clean.startsWith("/api/")) return true;
  if (clean.startsWith("/docs/")) {
    return KNOWN_DOC_SLUGS.has(clean.slice("/docs/".length));
  }
  if (isRoutable(clean)) return true;
  // Static asset served from public/ or app/ icon routes.
  const asset = clean.slice(1);
  return (
    fs.existsSync(path.join(root, "public", asset)) ||
    fs.existsSync(path.join(root, "app", asset))
  );
}

// ── Marketing routes (public, indexable) ────────────────────────────────────
const MARKETING_ROUTES = [
  "/",
  "/features",
  "/how-it-works",
  "/faq",
  "/contact",
  "/press",
  "/download",
  "/reviews",
  "/sitemap",
  "/privacy",
  "/terms",
  "/status",
  "/tools",
  "/tools/50-30-20-budget-calculator",
  "/tools/salary-budget-calculator",
  "/tools/emergency-fund-calculator",
  "/compare/spendwise-vs-walnut",
  "/compare/spendwise-vs-et-money",
  "/docs",
  "/docs/getting-started",
  "/docs/category-insights",
  "/docs/monthly-budgeting-guide",
  "/docs/50-30-20-budgeting-guide",
  "/docs/expense-tracking-guide",
];

const SITEWIDE_SOURCES = [
  "components/layout/Navbar.tsx",
  "components/layout/Footer.tsx",
  "components/layout/AnnouncementBar.tsx",
];

describe("Module 09 — internal linking", () => {
  describe("broken-link sweep", () => {
    it("every static href in app/, components/, lib/ resolves to a real target", () => {
      const broken: string[] = [];
      for (const file of sourceFiles) {
        const relPath = rel(file);
        if (COMMENT_LITERAL_FILES.has(relPath)) continue;
        if (relPath.startsWith("app/admin/") || relPath.startsWith("app/api/"))
          continue;
        const src = fs.readFileSync(file, "utf8");
        for (const href of staticHrefs(src)) {
          if (!href.startsWith("/") || href.startsWith("//")) continue;
          if (href.includes("/path") || href === "/x" || href === "/href")
            continue; // markdown-parser docstrings
          if (!targetExists(href)) broken.push(`${href} <- ${relPath}`);
        }
      }
      expect(broken).toEqual([]);
    });

    it("/docs/<slug> links only target known (seed, production, or repo) docs", () => {
      const offenders: string[] = [];
      for (const file of sourceFiles) {
        const relPath = rel(file);
        if (COMMENT_LITERAL_FILES.has(relPath)) continue;
        const src = fs.readFileSync(file, "utf8");
        for (const href of staticHrefs(src)) {
          if (!href.startsWith("/docs/")) continue;
          const slug = href.slice("/docs/".length).split("?")[0];
          if (!KNOWN_DOC_SLUGS.has(slug)) offenders.push(`${href} <- ${relPath}`);
        }
      }
      expect(offenders).toEqual([]);
    });
  });

  describe("contextual inbound links (no marketing orphan pages)", () => {
    // Static-extraction inbound: template-generated links (sidebar, docs
    // listing) deliberately do not count — a page nobody hard-links to is one
    // search engines only reach through the sitemap.
    const inbound = new Map<string, Set<string>>();
    for (const file of sourceFiles) {
      const relPath = rel(file);
      const src = fs.readFileSync(file, "utf8");
      for (const href of staticHrefs(src)) {
        const clean = href.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
        if (!MARKETING_ROUTES.includes(clean)) continue;
        if (!inbound.has(clean)) inbound.set(clean, new Set());
        inbound.get(clean)!.add(relPath);
      }
    }

    it.each(MARKETING_ROUTES)("%s has ≥1 contextual inbound link", (route) => {
      const sources = [...(inbound.get(route) ?? [])].filter(
        (s) => !SITEWIDE_SOURCES.includes(s)
      );
      expect(
        sources.length,
        `${route} is contextually orphaned (only navbar/footer reach it)`
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("cross-cluster edges (homepage ↔ tools ↔ guides ↔ comparisons)", () => {
    const edges: [source: string, target: string][] = [
      // Homepage → FAQ, guides, tools, proof
      ["components/landing/sections/FAQSection.tsx", 'href="/faq"'],
      [
        "components/landing/sections/FreeToolsCTA.tsx",
        'href: "/tools/50-30-20-budget-calculator"',
      ],
      [
        "components/landing/sections/FreeToolsCTA.tsx",
        'href: "/docs/monthly-budgeting-guide"',
      ],
      [
        "components/landing/sections/FreeToolsCTA.tsx",
        'href: "/docs/expense-tracking-guide"',
      ],
      ["components/landing/TestimonialsSection.tsx", "/reviews"],
      // Each tool → tools hub (breadcrumb) + a companion guide
      [
        "app/tools/50-30-20-budget-calculator/CalculatorClient.tsx",
        "/docs/50-30-20-budgeting-guide",
      ],
      [
        "app/tools/salary-budget-calculator/SalaryBudgetClient.tsx",
        "/docs/monthly-budgeting-guide",
      ],
      [
        "app/tools/emergency-fund-calculator/EmergencyFundClient.tsx",
        "/docs/monthly-budgeting-guide",
      ],
      // Comparisons → each other + free tool + guide
      ["app/compare/CompareClient.tsx", "/compare/spendwise-vs-walnut"],
      ["app/compare/CompareClient.tsx", "/compare/spendwise-vs-et-money"],
      ["app/compare/CompareClient.tsx", "/tools/50-30-20-budget-calculator"],
      ["app/compare/CompareClient.tsx", "/docs/monthly-budgeting-guide"],
      // Guides → getting-started (reached outside the /docs cluster)
      ["lib/docs-guides.ts", "/docs/getting-started"],
      // HTML sitemap → hubs that exist
      ["app/sitemap/page.tsx", 'href: "/tools"'],
      ["app/sitemap/page.tsx", 'href: "/docs"'],
      ["app/sitemap/page.tsx", 'href: "/reviews"'],
      ["app/sitemap/page.tsx", 'href: "/tools/salary-budget-calculator"'],
      ["app/sitemap/page.tsx", 'href: "/tools/emergency-fund-calculator"'],
    ];

    it.each(edges)("%s links %s", (source, needle) => {
      expect(read(source)).toContain(needle);
    });

    it("tools hub links all three tools (hub ↔ spokes)", () => {
      const hub = read("app/tools/page.tsx");
      for (const slug of [
        "50-30-20-budget-calculator",
        "salary-budget-calculator",
        "emergency-fund-calculator",
      ]) {
        expect(hub).toContain(`"/tools/${slug}"`);
      }
    });

    it("HTML sitemap lists every marketing route (click-depth ≤ 2 via /sitemap)", () => {
      const page = read("app/sitemap/page.tsx");
      for (const route of MARKETING_ROUTES) {
        if (route.startsWith("/docs/")) continue; // docs listed dynamically
        if (route === "/sitemap") continue; // a directory need not list itself
        expect.soft(page, `${route} missing from HTML sitemap`).toContain(
          `"${route}"`
        );
      }
    });
  });

  describe("anchor hygiene", () => {
    function anchorsAcrossFiles(): Map<string, string[]> {
      const map = new Map<string, string[]>(); // "anchor||href" -> files
      const linkRe =
        /<Link\s[^>]*href=["']([^"']+)["'][^>]*>\s*([^<>{}]+?)\s*<\/Link>/g;
      const mdRe = /\[([^\]]+)\]\((\/[^)#\s]+)\)/g;

      for (const file of sourceFiles) {
        const relPath = rel(file);
        const src = fs.readFileSync(file, "utf8");
        let m: RegExpExecArray | null;
        const re1 = new RegExp(linkRe.source, "g");
        while ((m = re1.exec(src)) !== null) {
          const text = m[2].replace(/\s+/g, " ").trim();
          if (!text) continue;
          const key = `${text}||${m[1]}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(relPath);
        }
        if (relPath === "lib/docs-guides.ts") {
          const re2 = new RegExp(mdRe.source, "g");
          while ((m = re2.exec(src)) !== null) {
            const key = `${m[1].trim()}||${m[2]}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(relPath);
          }
        }
      }
      return map;
    }

    it("no exact-match anchor is repeated across ≥3 different files", () => {
      const offenders: string[] = [];
      for (const [key, files] of anchorsAcrossFiles()) {
        const unique = [...new Set(files)];
        if (unique.length >= 3) offenders.push(`${key} (${unique.length} files)`);
      }
      expect(offenders).toEqual([]);
    });
  });

  describe("no hidden links", () => {
    it("no link is visually hidden (sr-only/hidden/aria-hidden)", () => {
      const offenders: string[] = [];
      for (const file of sourceFiles) {
        const relPath = rel(file);
        if (relPath.startsWith("app/admin/")) continue;
        const src = fs.readFileSync(file, "utf8");
        if (/<Link[^>]*className="[^"]*(?:sr-only|[^-]hidden\b)/.test(src))
          offenders.push(`${relPath}: Link with hidden class`);
        if (/<(?:div|span)[^>]*aria-hidden="true"[^>]*>\s*<Link/.test(src))
          offenders.push(`${relPath}: Link inside aria-hidden container`);
      }
      expect(offenders).toEqual([]);
    });
  });
});
