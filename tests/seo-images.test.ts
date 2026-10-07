import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/**
 * Module 13 — image & media SEO (static, code-level).
 *
 * Guards the OG-image inventory (every reference resolves to a real file),
 * social-card pairing (openGraph image implies twitter:image), icon/manifest
 * assets, SVG safety (no scripts/event handlers in served SVG), descriptive
 * og filenames, and dead-image assets. Pixel/format performance of the PNGs
 * themselves is documented in the module 13 audit (measured sizes, not
 * asserted here).
 */

function listFiles(dir: string, exts: string[]): string[] {
  if (!statSync(dir).isDirectory()) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { recursive: true }) as string[]) {
    const full = path.join(dir, entry);
    if (!statSync(full).isFile()) continue;
    if (exts.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

const appTsx = listFiles(path.join(root, "app"), [".tsx", ".ts"]);
const ogRef = (src: string) => src.match(/\/og-images\/[a-z0-9-]+\.png/g) ?? [];
const ogRefs = (file: string) => ogRef(readFileSync(file, "utf8"));

describe("OG / social-card images", () => {
  it("every rendered og:image reference resolves to a file in public/og-images/", () => {
    const missing: string[] = [];
    for (const file of appTsx) {
      for (const token of ogRefs(file)) {
        const onDisk = path.join(root, "public", token.slice(1));
        if (!statSync(onDisk).isFile()) missing.push(`${file} -> ${token}`);
      }
    }
    // Guard against the silent-404 class (was /status -> og-status-dark.png).
    expect(missing).toEqual([]);
  });

  it("every page that uses an og image also declares a twitter:image card", () => {
    const problems: string[] = [];
    for (const file of appTsx) {
      if (ogRefs(file).length === 0) continue;
      const src = readFileSync(file, "utf8");
      // Twitter blocks declare images as a string array; openGraph uses the
      // verbose object form, so the string-array form disambiguates them.
      if (!src.match(/twitter:\s*\{/)) {
        problems.push(`${file}: missing twitter block`);
        continue;
      }
      if (!src.match(/images:\s*\["\/og-images\/[a-z0-9-]+\.png"\]/)) {
        problems.push(`${file}: twitter block missing string-array images`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("og image filenames are descriptive kebab-case (no hashes or generated names)", () => {
    const bad: string[] = [];
    for (const file of appTsx) {
      for (const token of ogRefs(file)) {
        const name = token.split("/").pop()!.replace(/\.png$/, "");
        if (!/^([a-z]+-)*[a-z0-9]+(-(dark|light))?$/.test(name)) {
          bad.push(`${file}: ${token}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("manifest and favicon assets", () => {
  it("root layout declares the manifest and an existing apple icon", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain('manifest: "/manifest.json"');
    expect(layout).toContain('apple: "/web-app-manifest-192x192.png"');
    expect(
      statSync(path.join(root, "public/web-app-manifest-192x192.png")).isFile(),
    ).toBe(true);
  });

  it("PWA/web-app icons and app icon sources exist", () => {
    for (const p of [
      "public/web-app-manifest-192x192.png",
      "public/web-app-manifest-512x512.png",
      "app/icon0.svg",
      "app/icon1.png",
      "app/apple-icon.png",
    ]) {
      expect(statSync(path.join(root, p)).isFile(), p).toBe(true);
    }
  });

  it("manifest.json route is handled by Next (file convention, not a public dir file)", () => {
    // Next serves /manifest.json from its own generator unless a static file
    // exists; confirm we do not shadow it ambiguously.
    expect(existsSync(path.join(root, "public/manifest.json"))).toBe(false);
  });
});

describe("SVG safety and served-image hygiene", () => {
  it("no served SVG contains scripts or event-handler attributes", () => {
    const svgs = [
      path.join(root, "app/icon0.svg"),
      ...listFiles(path.join(root, "public"), [".svg"]),
    ];
    for (const f of svgs) {
      const src = readFileSync(f, "utf8");
      expect(/<script/i.test(src), `${f}: <script>`).toBe(false);
      expect(/onload\s*=/i.test(src), `${f}: onload`).toBe(false);
      expect(/onerror\s*=/i.test(src), `${f}: onerror`).toBe(false);
      expect(/(href|xlink:href)\s*=\s*["']https?:/i.test(src), `${f}: external ref`).toBe(false);
    }
  });
});

describe("dead media assets", () => {
  it("hero-mockup.png is not referenced anywhere in app or components", () => {
    const refs = [
      ...listFiles(path.join(root, "app"), [".tsx", ".ts"]),
      ...listFiles(path.join(root, "components"), [".tsx", ".ts"]),
    ].filter((f) => readFileSync(f, "utf8").includes("hero-mockup"));
    expect(refs).toEqual([]);
  });
});