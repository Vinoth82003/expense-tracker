import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Use production URL fallback if NEXTAUTH_URL environment variable is not defined
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_LINK || process.env.NEXTAUTH_URL || "https://thespendwise.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features",
          "/how-it-works",
          "/faq",
          "/docs",
          "/contact",
          "/privacy",
          "/terms",
          "/status",
          "/download",
          "/sitemap",
          "/reviews",
          "/llms.txt",
          "/compare/",
          "/tools/"
        ],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/expenses/",
          "/income/",
          "/groups/",
          "/profile/",
          "/settings/",
          "/reports/",
          "/analyze/",
          "/feedback/",
          "/notifications/",
          "/api/",
          "/onboarding/",
          "/verify-2fa/",
          "/maintenance/"
        ]
      },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Applebot-Extended",
          "Google-Extended",
          "OAI-SearchBot",
          "PerplexityBot",
          "cohere-ai"
        ],
        allow: [
          "/",
          "/features",
          "/how-it-works",
          "/faq",
          "/docs",
          "/contact",
          "/privacy",
          "/terms",
          "/status",
          "/download",
          "/sitemap",
          "/reviews",
          "/llms.txt",
          "/compare/",
          "/tools/"
        ],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/expenses/",
          "/income/",
          "/groups/",
          "/profile/",
          "/settings/",
          "/reports/",
          "/analyze/",
          "/feedback/",
          "/notifications/",
          "/api/",
          "/onboarding/",
          "/verify-2fa/",
          "/maintenance/",
          "/_next/",
          "/static/"
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
