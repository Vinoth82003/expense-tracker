import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Module 19 — international SEO & multilingual strategy.
// Stance: India-first. No internationalization/multilingual setup is warranted
// or implemented. This test locks in the default: single-language (en-IN or en)
// with no locale directories, no hreflang, no next-intl/i18n libs, and an
// explicit stance that premature country/locale pages are banned.
// ---------------------------------------------------------------------------

const root = path.resolve(__dirname, "..");

function read(p: string): string {
  return fs.readFileSync(path.join(root, p), "utf8");
}

function dirNames(p: string): string[] {
  return fs
    .readdirSync(path.join(root, p), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function walk(relBase: string, filterFn: (file: string) => boolean): string[] {
  const out: string[] = [];
  const base = path.join(root, relBase);
  for (const e of fs.readdirSync(base, { recursive: true }) as string[]) {
    const f = path.join(base, e);
    if (!fs.statSync(f).isFile()) continue;
    if (filterFn(f)) out.push(path.relative(root, f).replace(/\\/g, "/"));
  }
  return out;
}

const INTL_PHRASES = /hreflang|x-default|next-intl|react-intl|lingui|i18n\.|i18next|\balternate href\b.*locale|localePrefix|getStaticPaths.*locales/i;
const LOCALE_DIR_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

describe("Module 19 — international SEO (India-first stance)", () => {
  it("html lang defaults to English (en or en-IN)", () => {
    const layout = read("app/layout.tsx");
    const m = layout.match(/<html[^>]*lang="([^"]+)"/);
    expect(m, "html lang attribute").toBeTruthy();
    const lang = m![1];
    expect(lang === "en" || lang === "en-IN", lang).toBe(true);
  });

  it("no locale route directories exist (no /en, /hi, etc.)", () => {
    const appDirs = dirNames("app");
    const intlDirs = appDirs.filter((d) => LOCALE_DIR_RE.test(d));
    expect(intlDirs.length).toBe(0);
    const groupsDirs = appDirs.filter(
      (d) => LOCALE_DIR_RE.test(d) && d.startsWith("(") === false
    );
    const routeGroupsWithLocalePrefix = appDirs.filter((d) =>
      /^\([a-z]{2}(-[A-Z]{2})?\)/.test(d)
    );
    expect(groupsDirs.length).toBe(0);
    expect(routeGroupsWithLocalePrefix.length).toBe(0);
  });

  it("no internationalization libraries or i18n config in dependencies", () => {
    const pkg = read("package.json");
    expect(pkg).not.toMatch(/next-intl|react-intl|i18next|lingui|@lingui|i18n/);
  });

  it("no hreflang/x-default/next-intl/i18n usage in marketing/app source", () => {
    const files = [
      ...walk("app", (f) => /(\.(tsx|ts))$/.test(f)),
      ...walk("components", (f) => /(\.(tsx|ts))$/.test(f)),
    ].filter((f) => !f.includes("node_modules") && !f.includes(".next"));
    for (const f of files) {
      const s = read(f);
      // Allow the benign "en-IN" in toLocaleString only; flag other intl markers
      if (f.endsWith("reports/page.tsx")) continue;
      expect(s, f).not.toMatch(INTL_PHRASES);
    }
  });

  it("no country-specific or language-specific route slugs (e.g., /in/, /us/, /en/) exist", () => {
    for (const entry of fs.readdirSync(path.join(root, "app"))) {
      const name = entry;
      if (name.startsWith("in") || name.startsWith("us") || name === "en" || name === "hi") {
        expect(["(authenticated)", "admin", "api", "auth", "bridge"].includes(name), name).toBe(true);
      }
    }
    for (const e of fs.readdirSync(path.join(root, "app"), { recursive: true }) as string[]) {
      const rel = e.replace(/\\/g, "/");
      if (rel.startsWith("api/") || rel.startsWith("(authenticated)/") || rel.startsWith("admin/")) continue;
      expect(rel, `country/locale in route: ${rel}`).not.toMatch(/\/(in|us|gb|uk|ca|au|eu)\//);
      expect(rel, `lang prefix in route: ${rel}`).not.toMatch(/\/(en|hi|en-IN|hi-IN)\//);
    }
  });

  it("module 19 audit documents India-first stance and no premature internationalization", () => {
    const doc = read("../docs/seo/19-international-seo-and-multilingual-strategy-audit.md" as string);
    expect(doc).toMatch(/India-first/i);
    expect(doc).toMatch(/not applicable|no internationalization/i);
    expect(doc).toMatch(/no locale|no hreflang|single-language/i);
  });
});