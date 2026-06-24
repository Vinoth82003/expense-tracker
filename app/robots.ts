import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Use production URL fallback if NEXTAUTH_URL environment variable is not defined
  const baseUrl = process.env.NEXTAUTH_URL || "https://money-spend-tracker.vercel.app";

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
          "/llms.txt"
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
          "/llms.txt"
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
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
