import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { verifyAdminSession } from "@/lib/admin-auth";
import { DocsPageClient } from "@/app/docs/[[...slug]]/DocsPageClient";
import { DocsListingPage } from "@/components/docs/DocsListingPage";
import { stripMarkdown, extractExcerpt } from "@/lib/docs-utils";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

async function getDocsData(slugParam?: string[]) {
  const isAdmin = await verifyAdminSession();

  let whereClause: any = {};
  if (!isAdmin) {
    whereClause.status = "PUBLISHED";
  }

  const allDocs = await prisma.doc.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
  });

  const activeSlug = slugParam && slugParam.length > 0 ? slugParam[0] : null;

  let selectedDoc = null;
  if (activeSlug) {
    selectedDoc = allDocs.find((d) => d.slug === activeSlug) || null;
  }

  return { allDocs, selectedDoc, activeSlug };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { selectedDoc, allDocs } = await getDocsData(slug);

  // Listing page metadata
  if (!slug || slug.length === 0) {
    return {
      title: "Documentation | SpendWise",
      description:
        "Master SpendWise with comprehensive documentation — get started guides, budget tracking, AI insights, expense management, and troubleshooting.",
      openGraph: {
        title: "Documentation | SpendWise",
        description:
          "Master SpendWise with comprehensive documentation — get started guides, budget tracking, AI insights, expense management, and troubleshooting.",
        type: "website",
      },
    };
  }

  // Detail page metadata
  if (!selectedDoc) {
    return {
      title: "Doc Not Found | SpendWise Docs",
      description: "The requested documentation page could not be found.",
    };
  }

  const plainText = extractExcerpt(selectedDoc.content, 160);

  return {
    title: `${selectedDoc.title} | SpendWise Docs`,
    description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
    openGraph: {
      title: `${selectedDoc.title} | SpendWise Docs`,
      description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
      type: "article",
      publishedTime: selectedDoc.createdAt?.toString(),
      modifiedTime: selectedDoc.updatedAt?.toString(),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const { allDocs, selectedDoc } = await getDocsData(slug);

  const baseUrl = process.env.NEXTAUTH_URL || "https://money-spend-tracker.vercel.app";

  const serialize = (doc: any) => ({
    ...doc,
    createdAt: doc.createdAt?.toISOString() || null,
    updatedAt: doc.updatedAt?.toISOString() || null,
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
        <DocsListingPage docs={serializedAllDocs as any} />
      </>
    );
  }

  // ── Detail Page: /docs/[slug] ──
  if (!selectedDoc) {
    return (
      <div className="flex-1 max-w-4xl px-6 md:px-12 py-12">
        <div className="py-20 text-center space-y-4">
          <h3 className="text-2xl font-black">Document not found</h3>
          <p className="text-secondary">
            Please select another section from the sidebar.
          </p>
        </div>
      </div>
    );
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
        selectedDoc={serializedSelectedDoc as any}
        allDocs={serializedAllDocs as any}
      />
    </>
  );
}
