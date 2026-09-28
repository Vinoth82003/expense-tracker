import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { DocsPageClient } from "@/app/docs/[[...slug]]/DocsPageClient";
import { DocsListingPage } from "@/components/docs/DocsListingPage";
import { stripMarkdown, extractExcerpt } from "@/lib/docs-utils";
import { siteUrl } from "@/lib/site-url";
import type { Doc } from "@/types/docs";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

async function getDocsData(slugParam?: string[]) {
  const isAdmin = await verifyAdminSession();

  const whereClause: { status?: string } = isAdmin
    ? {}
    : { status: "PUBLISHED" };

  const allDocs = await prisma.doc.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
  });

  // Docs are single-segment slugs. Only slug[0] was ever consulted, so
  // /docs/getting-started/anything/else silently rendered getting-started —
  // an unlimited set of duplicate 200s for the same article.
  const activeSlug =
    slugParam && slugParam.length === 1 ? slugParam[0] : null;

  let selectedDoc = null;
  if (activeSlug) {
    selectedDoc = allDocs.find((d) => d.slug === activeSlug) || null;
  }

  return { allDocs, selectedDoc, activeSlug };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { selectedDoc } = await getDocsData(slug);

  const baseUrl = siteUrl();

  // Listing page metadata
  if (!slug || slug.length === 0) {
    return {
      title: "Documentation | SpendWise — AI-Powered Expense Tracker",
      description:
        "Master SpendWise with comprehensive documentation — get started guides, expense tracking, AI forensic analysis, budgeting, and troubleshooting.",
      alternates: {
        canonical: "/docs",
      },
      openGraph: {
        title: "Documentation | SpendWise — UPI Expense Tracker for India",
        description:
          "Master SpendWise with comprehensive documentation — get started guides, UPI budget tracking, AI insights, Indian financial year reporting, and troubleshooting.",
        url: `${baseUrl}/docs`,
        type: "website",
        images: [
          {
            url: "/og-images/og-docs-dark.png",
            width: 1200,
            height: 630,
            alt: "SpendWise Documentation",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Documentation | SpendWise — UPI Expense Tracker for India",
        description:
          "Master SpendWise with comprehensive documentation — get started guides, UPI budget tracking, AI insights, Indian financial year reporting, and troubleshooting.",
        images: ["/og-images/og-docs-dark.png"],
      },
    };
  }

  // Detail page metadata
  //
  // The page component calls notFound() for this same condition, so Google
  // receives a real 404. The metadata below only ever renders if metadata
  // generation and the render pass disagree (e.g. a doc was unpublished
  // between the two). Keep it noindex so that race can never produce an
  // indexable page with a self-referencing canonical — that combination is what
  // turned every junk /docs/* URL into a 200 in the index.
  if (!selectedDoc) {
    return {
      title: "Doc Not Found | SpendWise Docs",
      robots: { index: false, follow: false },
    };
  }

  const plainText = extractExcerpt(selectedDoc.content, 160);

  return {
    title: `${selectedDoc.title} | SpendWise Docs`,
    description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
    alternates: {
      canonical: `/docs/${selectedDoc.slug}`,
    },
    openGraph: {
      title: `${selectedDoc.title} | SpendWise Docs`,
      description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
      url: `${baseUrl}/docs/${selectedDoc.slug}`,
      type: "article",
      publishedTime: selectedDoc.createdAt?.toString(),
      modifiedTime: selectedDoc.updatedAt?.toString(),
      images: [
        {
          url: "/og-images/og-docs-dark.png",
          width: 1200,
          height: 630,
          alt: selectedDoc.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${selectedDoc.title} | SpendWise Docs`,
      description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
      images: ["/og-images/og-docs-dark.png"],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const { allDocs, selectedDoc } = await getDocsData(slug);

  const baseUrl = siteUrl();

  // Prisma returns Date objects; Doc (the prop type on the client components)
  // expects ISO strings. Doc already allows `string | Date` for updatedAt, so a
  // serialize that emits ISO strings satisfies it without a cast.
  const serialize = (doc: Doc): Doc => ({
    ...doc,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  });

  const serializedAllDocs = allDocs.map(serialize);

  // ── Listing Page: /docs ──
  if (!slug || slug.length === 0) {
    const listingStructuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "SpendWise Documentation",
      description:
        "Comprehensive documentation for SpendWise expense tracker — guides, tutorials, and reference.",
      url: `${baseUrl}/docs`,
      numberOfItems: allDocs.length,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: allDocs.map((doc, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "TechArticle",
            url: `${baseUrl}/docs/${doc.slug}`,
            name: doc.title,
            description: stripMarkdown(doc.content).slice(0, 150),
          },
        })),
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(listingStructuredData),
          }}
        />
          <DocsListingPage docs={serializedAllDocs} />
      </>
    );
  }

  // ── Detail Page: /docs/[slug] ──
  //
  // Hard 404 for any slug that does not resolve to a PUBLISHED doc (or to a
  // doc the caller is admin-authorised to preview). This route is a catch-all,
  // so every URL under /docs/* is reachable by typing. Returning a rendered
  // "Document not found" page with HTTP 200 made all of those soft 404s: a
  // 200 that Google will happily crawl, index, and then have to drop. notFound()
  // is what actually communicates "this does not exist".
  if (!selectedDoc) {
    notFound();
  }

  const serializedSelectedDoc = serialize(selectedDoc);

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: selectedDoc.title,
    description: stripMarkdown(selectedDoc.content).slice(0, 150),
    inLanguage: "en",
    mainEntityOfPage: `${baseUrl}/docs/${selectedDoc.slug}`,
    datePublished: selectedDoc.createdAt?.toISOString() || new Date("2024-05-01").toISOString(),
    dateModified: selectedDoc.updatedAt?.toISOString() || new Date().toISOString(),
    publisher: {
      "@type": "Organization",
      name: "SpendWise",
      logo: { "@type": "ImageObject", url: `${baseUrl}/web-app-manifest-192x192.png` },
    },
    author: { "@type": "Person", name: "Vinoth S" },
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Docs", item: `${baseUrl}/docs` },
      {
        "@type": "ListItem",
        position: 2,
        name: selectedDoc.category,
        item: `${baseUrl}/docs?category=${encodeURIComponent(selectedDoc.category)}`,
      },
      { "@type": "ListItem", position: 3, name: selectedDoc.title },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <DocsPageClient
        selectedDoc={serializedSelectedDoc}
        allDocs={serializedAllDocs}
      />
    </>
  );
}
