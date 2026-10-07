import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import { withStaticGuides, STATIC_GUIDES } from "@/lib/docs-guides";
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
  "/press": "2026-10-06",
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
  "/tools/50-30-20-budget-calculator": "2026-10-06",
  "/tools/salary-budget-calculator": "2026-10-06",
  "/tools/emergency-fund-calculator": "2026-10-06",
  "/tools": "2026-10-06",
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
    staticRoute(baseUrl, "/press", "monthly", 0.3),
    staticRoute(baseUrl, "/privacy", "monthly", 0.5),
    staticRoute(baseUrl, "/terms", "monthly", 0.5),
    staticRoute(baseUrl, "/download", "weekly", 0.8),
    staticRoute(baseUrl, "/compare/spendwise-vs-walnut", "monthly", 0.8),
    staticRoute(baseUrl, "/compare/spendwise-vs-et-money", "monthly", 0.8),
    staticRoute(baseUrl, "/reviews", "weekly", 0.7),
    staticRoute(baseUrl, "/sitemap", "monthly", 0.3),
    staticRoute(baseUrl, "/tools", "monthly", 0.9),
    staticRoute(baseUrl, "/tools/50-30-20-budget-calculator", "monthly", 0.9),
    staticRoute(baseUrl, "/tools/salary-budget-calculator", "monthly", 0.9),
    staticRoute(baseUrl, "/tools/emergency-fund-calculator", "monthly", 0.9),
  ];

  // Fetch docs from the database, merged with the repo-owned guides in
  // lib/docs-guides.ts. The DB wins on slug conflicts; guide lastmod values
  // are the fixed release dates pinned in that module (never `now`).
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

    const dynamicDocsRoutes = withStaticGuides(publishedDocs).map((doc) => ({
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
    // Guides live in the repository, so they still ship when the database is
    // down — only the DB-published docs are lost.
    const guideRoutes = STATIC_GUIDES.map((doc) => ({
      url: `${baseUrl}/docs/${doc.slug}`,
      lastModified: doc.updatedAt ?? doc.createdAt ?? FALLBACK_LASTMOD,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...guideRoutes];
  }
}
