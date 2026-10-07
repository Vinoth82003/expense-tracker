import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/site-url";

// Paths a crawler may fetch on the canonical (marketing) host. Everything not
// listed is blocked: the authenticated app, the admin console, and the API.
const ALLOWED_PATHS = [
  "/",
  "/features",
  "/how-it-works",
  "/faq",
  "/docs",
  "/contact",
  "/press",
  "/privacy",
  "/terms",
  "/status",
  "/download",
  "/sitemap",
  "/reviews",
  "/llms.txt",
  "/compare/",
  "/tools/",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

// No trailing slashes. robots.txt matches on raw path prefixes, so
// "Disallow: /dashboard/" leaves "/dashboard" itself crawlable — which is the
// URL the app actually serves. The prefix form blocks both.
const DISALLOWED_PATHS = [
  "/admin",
  "/bridge",
  "/dashboard",
  "/expenses",
  "/income",
  "/groups",
  "/profile",
  "/settings",
  "/reports",
  "/analyze",
  "/feedback",
  "/notifications",
  "/api",
  "/login",
  "/onboarding",
  "/verify-2fa",
  "/maintenance",
];

const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Applebot-Extended",
  "Google-Extended",
  "OAI-SearchBot",
  "PerplexityBot",
  "cohere-ai",
];

/**
 * True when this request did not arrive on the canonical marketing origin.
 *
 * Every deployment of this repo serves the same routes, so /privacy, /features
 * and the rest answer 200 with full content on the app origin
 * (money-spend-tracker.vercel.app) as well as on the marketing origin
 * (thespendwise.vercel.app). Each page ships a cross-domain canonical pointing
 * at the marketing origin, which is the correct signal, but two indexable
 * hosts serving identical markup is exactly the duplicate-content condition
 * those canonicals exist to defuse.
 *
 * The app origin has to keep serving the marketing pages — it is a working
 * app host, and redirecting it would break direct navigation there. So instead
 * of a redirect, a non-canonical host gets a blanket Disallow. That is the
 * documented way to keep a mirror host out of the index: crawlers can still
 * fetch it if a URL is known, they are simply never invited to, and the
 * canonical host receives the crawl budget and the ranking signals.
 *
 * Without the host check, the app origin's robots.txt advertised the marketing
 * origin's sitemap, inviting crawlers to treat both hosts as one site.
 */
async function isNonCanonicalHost(): Promise<boolean> {
  const host = (await headers()).get("host");
  if (!host) return false;
  try {
    return host !== new URL(siteUrl()).host;
  } catch {
    // Unparseable canonical origin: do not risk blocking the real site.
    return false;
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = siteUrl();

  if (await isNonCanonicalHost()) {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
      // No Sitemap: line here. The sitemap URL is absolute, so listing it would
      // invite crawlers to fetch it regardless of the disallow above, and the
      // host that serves it is not this one.
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOWED_PATHS,
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: ALLOWED_PATHS,
        disallow: [...DISALLOWED_PATHS, "/_next/", "/static/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
