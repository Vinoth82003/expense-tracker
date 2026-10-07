import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  STATIC_GUIDES,
  STATIC_GUIDE_SLUGS,
  GUIDE_CATEGORIES,
  withStaticGuides,
} from "@/lib/docs-guides";

// ---------------------------------------------------------------------------
// Module 08 — content hub.
// Locks the /guides → /docs decision (architecture bans /guides), the guide
// content standard (dates, examples, internal links, claim hygiene), and the
// repo-guides-merge-into-the-DB-pipeline wiring at every docs surface.
// ---------------------------------------------------------------------------

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function relExists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

// Doc slugs that ship with prisma/seed.ts — the DB-backed docs a guide may
// safely deep-link to (verified present in production as of 2026-10-06).
const seedSlugs = new Set(
  [...read("prisma/seed.ts").matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
);

function markdownLinks(content: string): string[] {
  return [...content.matchAll(/\]\((\/[^)#\s]+)\)/g)].map((m) => m[1]);
}

const EXPECTED_SLUGS = [
  "monthly-budgeting-guide",
  "50-30-20-budgeting-guide",
  "expense-tracking-guide",
];

// Claim vocabulary shared with the other SEO suites — guides are marketing-
// visible pages and inherit the same no-fabrication rules.
const FORBIDDEN_CLAIMS =
  /★|\d\.\d\s*\/\s*5|rated\s+\d|out of 5|India's #1|best expense tracker|award|guaranteed|free forever|thousands of users|millions of users|100% (secure|free)|proven to (save|increase|boost)/i;

describe("Module 08 — content hub", () => {
  describe("architecture decision: guides live at /docs, never /guides", () => {
    it("has no app/guides directory (permanently reserved non-route)", () => {
      expect(relExists("app/guides")).toBe(false);
    });

    it("no component links to the reserved /guides path", () => {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.name.endsWith(".tsx")) files.push(full);
        }
      };
      walk(path.join(root, "app"));
      walk(path.join(root, "components"));

      for (const file of files) {
        const src = fs.readFileSync(file, "utf8");
        expect.soft(src, `${file} must not link to /guides`).not.toMatch(
          /href=["'`]\/guides/
        );
      }
    });
  });

  describe("guide registry", () => {
    it("ships the three starter guides with the expected slugs", () => {
      expect(STATIC_GUIDES.map((g) => g.slug).sort()).toEqual(
        [...EXPECTED_SLUGS].sort()
      );
      expect(STATIC_GUIDE_SLUGS).toEqual(new Set(EXPECTED_SLUGS));
    });

    it("all guides are PUBLISHED markdown with unique ids and slugs", () => {
      for (const guide of STATIC_GUIDES) {
        expect(guide.status).toBe("PUBLISHED");
        expect(guide.contentType).toBe("MARKDOWN");
      }
      expect(new Set(STATIC_GUIDES.map((g) => g.id)).size).toBe(
        STATIC_GUIDES.length
      );
      expect(new Set(STATIC_GUIDES.map((g) => g.slug)).size).toBe(
        STATIC_GUIDES.length
      );
      expect(new Set(STATIC_GUIDES.map((g) => g.title)).size).toBe(
        STATIC_GUIDES.length
      );
    });

    it("uses only approved cluster categories", () => {
      for (const guide of STATIC_GUIDES) {
        expect(GUIDE_CATEGORIES).toContain(guide.category);
      }
    });

    it("pins a fixed release date — never Date.now()", () => {
      for (const guide of STATIC_GUIDES) {
        expect(guide.createdAt).toBeInstanceOf(Date);
        expect((guide.createdAt as Date).toISOString()).toBe(
          "2026-10-06T00:00:00.000Z"
        );
        expect((guide.updatedAt as Date).toISOString()).toBe(
          "2026-10-06T00:00:00.000Z"
        );
      }
    });
  });

  describe("guide content standard", () => {
    it.each(STATIC_GUIDES.map((g) => [g.slug, g] as const))(
      "%s states a review date",
      (_slug, guide) => {
        expect(guide.content).toMatch(/\*Last reviewed: [A-Z][a-z]+ \d{4}\.\*/);
      }
    );

    it.each(STATIC_GUIDES.map((g) => [g.slug, g] as const))(
      "%s has no markdown H1 (the page renders its own <h1>)",
      (_slug, guide) => {
        expect(guide.content).not.toMatch(/^# /m);
      }
    );

    it.each(STATIC_GUIDES.map((g) => [g.slug, g] as const))(
      "%s includes a worked ₹ example labelled as an example",
      (_slug, guide) => {
        expect(guide.content).toMatch(/₹\s?[\d,]+/);
        expect(guide.content).toMatch(/example/i);
      }
    );

    it.each(STATIC_GUIDES.map((g) => [g.slug, g] as const))(
      "%s has at least two internal links, all resolving to real routes",
      (_slug, guide) => {
        const links = markdownLinks(guide.content);
        expect(links.length).toBeGreaterThanOrEqual(2);

        for (const href of links) {
          let resolvable: boolean;
          if (href === "/docs") {
            resolvable = relExists("app/docs/[[...slug]]/page.tsx");
          } else if (href.startsWith("/docs/")) {
            const docSlug = href.slice("/docs/".length);
            resolvable =
              STATIC_GUIDE_SLUGS.has(docSlug) || seedSlugs.has(docSlug);
          } else if (href.startsWith("/tools")) {
            const toolPath =
              href === "/tools" ? "app/tools" : `app${href}`;
            resolvable = relExists(`${toolPath}/page.tsx`);
          } else {
            resolvable = relExists(`app${href}/page.tsx`);
          }
          expect.soft(resolvable, `unresolvable internal link: ${href} in ${guide.slug}`).toBe(true);
        }
      }
    );

    it("keeps every guide free of fabricated claims", () => {
      for (const guide of STATIC_GUIDES) {
        expect(
          FORBIDDEN_CLAIMS.test(guide.content),
          `forbidden claim language in ${guide.slug}`
        ).toBe(false);
      }
    });

    it("guide titles never collide with tool-page titles", () => {
      for (const guide of STATIC_GUIDES) {
        expect(guide.title).not.toMatch(/Calculator/i);
      }
      expect(STATIC_GUIDE_SLUGS.has("50-30-20-budget-calculator")).toBe(false);
    });
  });

  describe("withStaticGuides merge helper", () => {
    it("appends all guides when the DB is empty", () => {
      const merged = withStaticGuides<{ slug: string }>([]);
      expect(merged.map((d) => d.slug).sort()).toEqual(
        [...EXPECTED_SLUGS].sort()
      );
    });

    it("lets the DB win on slug conflicts and preserves DB order", () => {
      const dbDocs = [
        { slug: "50-30-20-budgeting-guide", title: "Admin edited" },
        { slug: "getting-started" },
      ];
      const merged = withStaticGuides(dbDocs);
      expect(merged).toHaveLength(1 + STATIC_GUIDES.length);
      expect(merged[0].title).toBe("Admin edited");
      expect(
        merged.filter((d) => d.slug === "50-30-20-budgeting-guide")
      ).toHaveLength(1);
      expect(merged.some((d) => d.slug === "monthly-budgeting-guide")).toBe(
        true
      );
    });
  });

  describe("every docs surface merges the repo-owned guides", () => {
    const surfaces = [
      ["article + listing page", "app/docs/[[...slug]]/page.tsx"],
      ["sidebar layout", "app/docs/layout.tsx"],
      ["XML sitemap", "app/sitemap.ts"],
      ["llms.txt", "app/llms.txt/route.ts"],
      ["HTML sitemap", "app/sitemap/page.tsx"],
    ] as const;

    it.each(surfaces)("%s imports the merge helper", (_label, file) => {
      expect(read(file)).toContain("withStaticGuides");
    });

    it("XML sitemap still serves guides when the DB is down", () => {
      const src = read("app/sitemap.ts");
      expect(src).toMatch(/catch[\s\S]*STATIC_GUIDES\.map/);
    });

    it("feedback widget is hidden for guides (no DB row to write to)", () => {
      const page = read("app/docs/[[...slug]]/page.tsx");
      expect(page).toContain("showFeedback={!STATIC_GUIDE_SLUGS.has(selectedDoc.slug)}");

      const client = read("app/docs/[[...slug]]/DocsPageClient.tsx");
      expect(client).toMatch(/showFeedback\?: boolean/);
      expect(client).toContain("{showFeedback && (");
    });

    it("/docs listing metadata and hero mention the guides", () => {
      const page = read("app/docs/[[...slug]]/page.tsx");
      expect(page).toMatch(/description:\s*\n?\s*"[^"]*personal finance guides/i);

      const listing = read("components/docs/DocsListingPage.tsx");
      expect(listing).toMatch(/budgeting and\s*\n?\s*expense tracking/i);
    });
  });
});
