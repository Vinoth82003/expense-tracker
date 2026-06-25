import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://money-spend-tracker.vercel.app";
  const staticDate = new Date("2024-05-01T00:00:00Z");

  // Base static public pages of the application
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: staticDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: staticDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: staticDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: staticDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: staticDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: staticDate,
      changeFrequency: "hourly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: staticDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.4,
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
