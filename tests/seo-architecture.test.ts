import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

describe("Module 04 — site architecture", () => {
  describe("reserved / future-safe URL rules", () => {
    it("does not create a competing /guides route tree (guides live at /docs)", () => {
      expect(exists("app/guides")).toBe(false);
    });

    it("does not create an empty /research hub", () => {
      expect(exists("app/research")).toBe(false);
    });

    it("does not create bare /compare index hubs (thin-hub ban)", () => {
      expect(exists("app/compare/page.tsx")).toBe(false);
    });

    it("allows a /tools hub only when 3+ tool pages exist (anti-thin-hub)", () => {
      const toolsDir = path.join(root, "app/tools");
      const toolPages = fs
        .readdirSync(toolsDir, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() &&
            fs.existsSync(path.join(toolsDir, entry.name, "page.tsx"))
        );
      if (exists("app/tools/page.tsx")) {
        expect(toolPages.length).toBeGreaterThanOrEqual(3);
      } else {
        expect(toolPages.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("robots cluster allowlisting", () => {
    const robots = read("app/robots.ts");

    it("allows /tools/ for the tools cluster", () => {
      expect(robots).toMatch(/"\/tools\/"/);
    });

    it("allows /compare/ for the comparison cluster", () => {
      expect(robots).toMatch(/"\/compare\/"/);
    });

    it("still disallows private app paths", () => {
      expect(robots).toMatch(/"\/bridge"/);
      expect(robots).toMatch(/"\/login"/);
    });
  });

  describe("breadcrumbs on hub pages", () => {
    it("compare pages render a visible breadcrumb trail", () => {
      const compare = read("app/compare/CompareClient.tsx");
      expect(compare).toContain("SiteBreadcrumbs");
      expect(compare).toContain('"Compare"');
    });

    it("tool page renders a visible breadcrumb trail", () => {
      const tool = read(
        "app/tools/50-30-20-budget-calculator/CalculatorClient.tsx"
      );
      expect(tool).toContain("SiteBreadcrumbs");
      expect(tool).toContain('"Tools"');
    });

    it("compare and tool pages emit BreadcrumbList JSON-LD", () => {
      for (const rel of [
        "app/compare/spendwise-vs-walnut/page.tsx",
        "app/compare/spendwise-vs-et-money/page.tsx",
        "app/tools/50-30-20-budget-calculator/page.tsx",
        "app/tools/salary-budget-calculator/page.tsx",
        "app/tools/emergency-fund-calculator/page.tsx",
        "app/tools/page.tsx",
      ]) {
        const src = read(rel);
        expect(src).toContain("breadcrumbJsonLd");
        expect(src).toContain("breadcrumbStructuredData");
        expect(src).toContain(
          "JSON.stringify(breadcrumbStructuredData)"
        );
      }
      // The "@type": "BreadcrumbList" literal lives in the shared helper.
      expect(read("components/seo/SiteBreadcrumbs.tsx")).toContain(
        '"@type": "BreadcrumbList"'
      );
    });

    it("shared breadcrumb component is accessible and server-safe", () => {
      const src = read("components/seo/SiteBreadcrumbs.tsx");
      // No "use client" — server pages call breadcrumbJsonLd() from this
      // module, which fails at build time if the module is a client boundary.
      expect(src).not.toContain('"use client"');
      expect(src).toContain('aria-label="Breadcrumb"');
      expect(src).toContain("BreadcrumbList");
    });
  });

  describe("cluster coverage in sitemap + footer", () => {
    const sitemap = read("app/sitemap.ts");
    const footer = read("components/layout/Footer.tsx");

    const clusterRoutes = [
      "/compare/spendwise-vs-walnut",
      "/compare/spendwise-vs-et-money",
      "/tools",
      "/tools/50-30-20-budget-calculator",
      "/tools/salary-budget-calculator",
      "/tools/emergency-fund-calculator",
      "/docs",
      "/features",
      "/reviews",
    ];

    it.each(clusterRoutes)("route %s is in the XML sitemap", (route) => {
      expect(sitemap).toContain(`"${route}"`);
    });

    it.each(clusterRoutes)("route %s is linked from the footer", (route) => {
      expect(footer).toContain(`"${route}"`);
    });
  });

  describe("cannibalization guards", () => {
    it("marketing pages declare distinct self-canonicals", () => {
      const pages = [
        "app/features/page.tsx",
        "app/how-it-works/page.tsx",
        "app/compare/spendwise-vs-walnut/page.tsx",
        "app/compare/spendwise-vs-et-money/page.tsx",
        "app/tools/50-30-20-budget-calculator/page.tsx",
        "app/tools/salary-budget-calculator/page.tsx",
        "app/tools/emergency-fund-calculator/page.tsx",
      ];
      const canonicals = pages.map((rel) => {
        const src = read(rel);
        const m = src.match(/canonical:\s*"([^"]+)"/);
        expect(m, `${rel} must declare a canonical`).toBeTruthy();
        return m![1];
      });
      expect(new Set(canonicals).size).toBe(canonicals.length);
    });

    it("no source file hardcodes a /guides or /research link", () => {
      const suspicious: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (
            entry.name === "node_modules" ||
            entry.name === ".next" ||
            entry.name.startsWith(".")
          )
            continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (/\.(tsx?|jsx?|md)$/.test(entry.name)) {
            const src = fs.readFileSync(full, "utf8");
            if (/href=["']\/(guides|research)/.test(src)) suspicious.push(full);
          }
        }
      };
      walk(path.join(root, "app"));
      walk(path.join(root, "components"));
      expect(suspicious).toEqual([]);
    });
  });
});
