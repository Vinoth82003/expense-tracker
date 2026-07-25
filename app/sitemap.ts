import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://money-spend-tracker.vercel.app";
  const now = new Date();

  // Base static public pages of the application
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/compare/spendwise-vs-walnut`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare/spendwise-vs-et-money`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/50-30-20-budget-calculator`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
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
      },
    });

    const dynamicDocsRoutes = publishedDocs.map((doc) => ({
      url: `${baseUrl}/docs/${doc.slug}`,
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...dynamicDocsRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
    // Return static routes if the database fetch fails
    return staticRoutes;
  }
}
