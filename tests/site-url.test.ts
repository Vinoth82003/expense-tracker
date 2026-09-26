import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { appUrl, siteUrl, hasLocalhostOriginLeak } from "@/lib/site-url";

// Regression cover for the incident where outbound "Share Feedback" emails
// shipped http://localhost:3000/feedback because every link in lib/mail.ts was
// built from NEXTAUTH_URL, which is localhost in local dev and was not
// guaranteed to be set on the production deployment.

const ENV_KEYS = [
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_ORIGIN",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_PRODUCTION_LINK",
  "NEXT_PUBLIC_MARKETING_ORIGIN",
] as const;

let saved: Record<string, string | undefined> = {};

/** NODE_ENV is typed read-only, so it has to go through vi.stubEnv. */
function setNodeEnv(value: string) {
  vi.stubEnv("NODE_ENV", value);
}

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("site-url — production must never emit a loopback URL", () => {
  it("ignores a localhost NEXTAUTH_URL in production", () => {
    setNodeEnv("production");
    process.env.NEXTAUTH_URL = "http://localhost:3000";

    // The exact failure from the incident: this used to be the feedback link.
    expect(appUrl("/feedback")).toBe(
      "https://money-spend-tracker.vercel.app/feedback"
    );
    expect(appUrl("/feedback")).not.toContain("localhost");
    expect(appUrl("/feedback")).not.toContain("127.0.0.1");
  });

  it("reports a leak when an explicit origin is itself loopback in production", () => {
    setNodeEnv("production");
    expect(hasLocalhostOriginLeak()).toBe(false);

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(hasLocalhostOriginLeak()).toBe(true);
  });

  it("honours a loopback NEXTAUTH_URL outside production so dev stays clickable", () => {
    setNodeEnv("development");
    process.env.NEXTAUTH_URL = "http://localhost:3000";

    expect(appUrl("/dashboard")).toBe("http://localhost:3000/dashboard");
  });

  it("ignores a non-loopback NEXTAUTH_URL outside production", () => {
    setNodeEnv("development");
    // Staging host in NEXTAUTH_URL must not become the public app origin.
    process.env.NEXTAUTH_URL = "https://staging.example.com";

    expect(appUrl("/feedback")).toBe(
      "https://money-spend-tracker.vercel.app/feedback"
    );
  });
});

describe("site-url — explicit configuration wins", () => {
  it("prefers NEXT_PUBLIC_APP_URL over NEXT_PUBLIC_APP_ORIGIN", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://other.example.com";

    expect(appUrl("/settings")).toBe("https://app.example.com/settings");
  });

  it("falls back to NEXT_PUBLIC_APP_ORIGIN when no explicit app URL is set", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://app.example.com";

    expect(appUrl("/settings")).toBe("https://app.example.com/settings");
  });

  it("prefers NEXT_PUBLIC_SITE_URL for SEO surfaces", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example.com";
    process.env.NEXT_PUBLIC_PRODUCTION_LINK = "https://legacy.example.com";

    expect(siteUrl("/features")).toBe("https://site.example.com/features");
  });

  it("accepts NEXT_PUBLIC_MARKETING_ORIGIN as a site origin", () => {
    process.env.NEXT_PUBLIC_MARKETING_ORIGIN = "https://marketing.example.com";

    expect(siteUrl("/privacy")).toBe("https://marketing.example.com/privacy");
  });
});

describe("site-url — URL joining", () => {
  it("returns the bare origin when no path is given", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    expect(appUrl()).toBe("https://app.example.com");
  });

  it("does not double up slashes when the path lacks a leading slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    expect(appUrl("feedback")).toBe("https://app.example.com/feedback");
  });

  it("preserves query strings on unsubscribe links", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    expect(appUrl(`/api/unsubscribe?email=${encodeURIComponent("a@b.c")}`)).toBe(
      "https://app.example.com/api/unsubscribe?email=a%40b.c"
    );
  });

  it("strips a trailing slash from the configured origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example.com/";
    expect(siteUrl("/faq")).toBe("https://site.example.com/faq");
  });
});

describe("site-url — app and site origins are independently configurable", () => {
  it("keeps authenticated links and canonical links on their own origins", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example.com";

    // /feedback only exists behind auth -> app origin.
    expect(appUrl("/feedback")).toBe("https://app.example.com/feedback");
    // /features is a public marketing page -> site origin.
    expect(siteUrl("/features")).toBe("https://site.example.com/features");
  });
});
