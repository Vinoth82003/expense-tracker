import type { Metadata } from "next";
import { ReviewsClient, type Review } from "./ReviewsClient";
import { siteUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";

const baseUrl = siteUrl();

// Reviews change slowly and the page is public, indexable, and read-heavy.
// Cache it rather than hitting MongoDB on every crawl.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Customer Reviews | SpendWise — Expense Tracker for India",
  description:
    "Read authentic reviews from SpendWise users. See what people say about AI-powered expense tracking, budgeting, and financial insights.",
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    title: "Customer Reviews | SpendWise — Expense Tracker for India",
    description:
      "Read authentic reviews from SpendWise users. See what people say about AI-powered expense tracking, budgeting, and financial insights.",
    url: `${baseUrl}/reviews`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise Customer Reviews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer Reviews | SpendWise",
    description:
      "Read authentic reviews from SpendWise users about expense tracking and budgeting.",
    images: ["/og-images/og-home-dark.png"],
  },
};

/**
 * Reviews are resolved here, on the server, so they are present in the
 * server-rendered HTML.
 *
 * They used to be fetched from /api/reviews inside a client useEffect, which
 * meant the crawler received an empty page: /api/ is Disallow:ed in
 * app/robots.ts, so Google's renderer could not run the request that supplied
 * the content. Returning null (rather than throwing) lets the client retry
 * if the database is briefly unreachable.
 */
async function getReviews(): Promise<Review[] | null> {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true, avatar: true } },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 60,
    });

    return reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load reviews for /reviews:", error);
    return null;
  }
}

export default async function ReviewsPage() {
  const reviews = await getReviews();

  const collectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "SpendWise Customer Reviews",
    description:
      "Authentic customer reviews and testimonials for SpendWise, the AI-powered expense tracker built for India.",
    url: `${baseUrl}/reviews`,
    about: {
      "@type": "SoftwareApplication",
      name: "SpendWise",
      applicationCategory: "FinanceApplication",
    },
  };

  // Only emit Review/aggregateRating markup for data that actually rendered.
  // Structured data that describes reviews missing from the HTML is a manual
  // action risk, and an empty reviews list must not produce a fake rating.
  const renderedReviews = reviews ?? [];
  const hasRenderableReviews = renderedReviews.length > 0;

  const reviewStructuredData = hasRenderableReviews
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "SpendWise",
        description:
          "AI-powered expense tracker and budget manager for India.",
        url: baseUrl,
        review: renderedReviews.slice(0, 20).map((r) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
          author: {
            "@type": "Person",
            name: r.user?.name || "Anonymous SpendWise User",
          },
          reviewBody: r.comment,
          datePublished: r.createdAt,
        })),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue:
            renderedReviews.reduce((sum, r) => sum + r.rating, 0) /
            renderedReviews.length,
          reviewCount: renderedReviews.length,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionStructuredData),
        }}
      />
      {reviewStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(reviewStructuredData),
          }}
        />
      )}
      <ReviewsClient initialReviews={reviews} />
    </>
  );
}
