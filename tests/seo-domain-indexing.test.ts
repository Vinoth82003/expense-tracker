import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Module 02 — domain, redirects, private-route indexation, 404, webmaster.
// Locks the host/origin contract, X-Robots-Tag defense-in-depth on middleware
// routes, verification assets, and absence of trailing-slash config overrides.
// ---------------------------------------------------------------------------

const CANONICAL_HOST = "thespendwise.vercel.app";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(async () => null),
}));

vi.mock("@/lib/admin-auth", () => ({
  verifyAdminToken: vi.fn(async () => false),
}));

import { middleware } from "@/middleware";
import { getToken } from "next-auth/jwt";

const clientRoot = path.join(__dirname, "..");

function requestFor(pathname: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://${CANONICAL_HOST}${pathname}`, {
    headers: { "x-forwarded-for": "module-02-test", ...headers },
  });
}

describe("private routes — X-Robots-Tag defense-in-depth", () => {
  beforeEach(() => {
    vi.mocked(getToken).mockResolvedValue(null);
  });

  it("sets noindex on redirects to login for unauthenticated app routes", async () => {
    const response = await middleware(requestFor("/dashboard"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("sets noindex on admin redirect when the admin cookie is missing", async () => {
    const response = await middleware(requestFor("/admin"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("sets noindex on HTML next() responses for authenticated sessions", async () => {
    vi.mocked(getToken).mockResolvedValue({ sub: "user-test" });

    const response = await middleware(requestFor("/expenses"));

    expect(response.status).toBeLessThan(300);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("does not add X-Robots-Tag to JSON API 401 bodies", async () => {
    const response = await middleware(requestFor("/api/expenses"));

    expect(response.status).toBe(401);
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("covers invite tokens under /groups", async () => {
    const response = await middleware(requestFor("/groups/invite/some-token"));

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
});

describe("domain + host configuration", () => {
  const siteUrlSource = readFileSync(path.join(clientRoot, "lib", "site-url.ts"), "utf8");

  it("defaults to the verified marketing host, not a custom domain", () => {
    expect(siteUrlSource).toContain("https://thespendwise.vercel.app");
    expect(siteUrlSource).toContain("https://money-spend-tracker.vercel.app");
  });

  it("only consults NEXTAUTH_URL for loopback dev origins, never in production", () => {
    expect(siteUrlSource).toMatch(/process\.env\.NEXTAUTH_URL/);
    expect(siteUrlSource).toMatch(/deliberately NOT consulted in production/i);
    expect(siteUrlSource).toMatch(/isLoopback\(devUrl\)/);
  });

  it("has no trailingSlash override in next.config (Next auto-normalizes)", () => {
    const config = readFileSync(path.join(clientRoot, "next.config.ts"), "utf8");
    expect(config).not.toMatch(/trailingSlash\s*:/);
  });

  it("has no custom redirects() that could strand canonical URLs", () => {
    const config = readFileSync(path.join(clientRoot, "next.config.ts"), "utf8");
    expect(config).not.toMatch(/async\s+redirects\s*\(/);
  });
});

describe("404 behavior", () => {
  const notFound = readFileSync(path.join(clientRoot, "app", "not-found.tsx"), "utf8");

  it("sends marketing visitors home, not into the authenticated app", () => {
    expect(notFound).toContain("Back to Home");
    expect(notFound).not.toContain("Back to Dashboard");
  });
});

describe("webmaster verification assets", () => {
  it("exposes a Google site verification file", () => {
    const file = path.join(clientRoot, "public", "google0fea68fbc5b16c67.html");
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toContain("google-site-verification");
  });

  it("declares the GSC meta token in root metadata", () => {
    const layout = readFileSync(path.join(clientRoot, "app", "layout.tsx"), "utf8");
    expect(layout).toMatch(/verification\s*:\s*\{[^}]*google:\s*"[a-z0-9]+"/);
  });

  it("ships favicon + apple touch icon sources", () => {
    expect(existsSync(path.join(clientRoot, "app", "favicon.ico"))).toBe(true);
    expect(existsSync(path.join(clientRoot, "app", "apple-icon.png"))).toBe(true);
  });

  it("has no invented Bing/Yandex tokens in layout", () => {
    const layout = readFileSync(path.join(clientRoot, "app", "layout.tsx"), "utf8");
    expect(layout).not.toMatch(/verification\s*:\s*\{[^}]*\bbing\b/);
    expect(layout).not.toMatch(/verification\s*:\s*\{[^}]*\byandex\b/);
  });
});

describe("metadataBase + canonical origin", () => {
  it("uses SITE_ORIGIN for metadataBase and homepage canonical", () => {
    const layout = readFileSync(path.join(clientRoot, "app", "layout.tsx"), "utf8");
    expect(layout).toContain("metadataBase: new URL(SITE_ORIGIN)");
    expect(layout).toMatch(/canonical:\s*"\/"/);
  });
});
