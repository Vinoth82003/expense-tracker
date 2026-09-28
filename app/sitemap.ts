import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

// ---------------------------------------------------------------------------
// WHY THERE IS NO `new Date()` IN HERE
// ---------------------------------------------------------------------------
// This file used to build every static entry with `lastModified: now`. Because
// `now` was evaluated per request, each fetch of /sitemap.xml reported all 14
// static URLs as modified at that instant. Googlebot saw lastmod churn on
// essentially every fetch, learned the field carried no information, and
// stopped treating the sitemap as a freshness signal — the pages went to
// "Discovered - currently not indexed" with `Last crawled: N/A`.
//
// `lastModified` is now a per-page constant that only changes when a human
// actually edits that page. For the routes below that means updating the entry
// by hand in the same commit as the content change. That is the intended
// trade: a lastmod that is occasionally a day stale costs nothing, a lastmod
// that always lies costs the whole sitemap's credibility.

type Route = {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

// Docs are published through the admin console at runtime, so a fully static
// sitemap would omit anything published after the last deploy. Revalidating
// hourly picks up new docs without pretending the old pages changed: the
// per-route lastModified values below still only move when a human edits them.
export const revalidate = 3600;

// Bump a route's lastModified when its content meaningfully changes.
export const STATIC_ROUTE_LASTMOD: Record<string, string> = {
  "/": "2026-09-26",
  "/features": "2026-09-26",
  "/how-it-works": "2026-08-14",
  "/faq": "2026-09-26",
  "/docs": "2026-07-08",
  "/contact": "2026-07-02",
  "/privacy": "2026-06-01",
  "/terms": "2026-06-01",
  // /status renders live service health, so it is genuinely volatile. It is
  // noindex (see app/status/layout.tsx) and kept out of this sitemap: hourly
  // churn on a page with no search value only invites re-crawls.
  "/download": "2026-08-20",
  "/reviews": "2026-09-26",
  "/sitemap": "2026-09-26",
  "/compare/spendwise-vs-walnut": "2026-07-18",
  "/compare/spendwise-vs-et-money": "2026-07-18",
  "/tools/50-30-20-budget-calculator": "2026-08-30",
};

// Fallback for a route with no explicit entry above. Deliberately an old fixed
// date rather than `new Date()`: an understated lastmod is safe, a fabricated
// one is what broke this file.
const FALLBACK_LASTMOD = new Date("2026-06-01T00:00:00.000Z");

function lastmodFor(path: string): Date {
  const iso = STATIC_ROUTE_LASTMOD[path];
  return iso ? new Date(`${iso}T00:00:00.000Z`) : FALLBACK_LASTMOD;
}

function staticRoute(
  baseUrl: string,
  path: string,
  changeFrequency: Route["changeFrequency"],
  priority: number
): Route {
  return {
    url: path === "/" ? baseUrl : `${baseUrl}${path}`,
    lastModified: lastmodFor(path),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();

  const staticRoutes: Route[] = [
    staticRoute(baseUrl, "/", "weekly", 1.0),
    staticRoute(baseUrl, "/features", "weekly", 0.8),
    staticRoute(baseUrl, "/how-it-works", "weekly", 0.8),
    staticRoute(baseUrl, "/faq", "weekly", 0.7),
    staticRoute(baseUrl, "/docs", "weekly", 0.8),
    staticRoute(baseUrl, "/contact", "monthly", 0.6),
    staticRoute(baseUrl, "/privacy", "monthly", 0.5),
    staticRoute(baseUrl, "/terms", "monthly", 0.5),
    staticRoute(baseUrl, "/download", "weekly", 0.8),
    staticRoute(baseUrl, "/compare/spendwise-vs-walnut", "monthly", 0.8),
    staticRoute(baseUrl, "/compare/spendwise-vs-et-money", "monthly", 0.8),
    staticRoute(baseUrl, "/reviews", "weekly", 0.7),
    staticRoute(baseUrl, "/sitemap", "monthly", 0.3),
    staticRoute(baseUrl, "/tools/50-30-20-budget-calculator", "monthly", 0.9),
  ];

  // Fetch dynamic docs from database and add to sitemap
  try {
    const publishedDocs = await prisma.doc.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    const dynamicDocsRoutes = publishedDocs.map((doc) => ({
      url: `${baseUrl}/docs/${doc.slug}`,
      // Real per-document timestamps. Falls back to the doc's creation date
      // rather than to `now` for the same reason as above.
      lastModified: doc.updatedAt ?? doc.createdAt ?? FALLBACK_LASTMOD,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...dynamicDocsRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
    // Return static routes if the database fetch fails
    return staticRoutes;
  }
}
