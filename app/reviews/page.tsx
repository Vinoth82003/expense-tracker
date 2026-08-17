import type { Metadata } from "next";
import { ReviewsClient } from "./ReviewsClient";

const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_LINK || process.env.NEXTAUTH_URL || "https://thespendwise.vercel.app";

export const metadata: Metadata = {
  title: "Customer Reviews | SpendWise — India's #1 Expense Tracker",
  description:
    "Read authentic reviews from thousands of happy SpendWise users. See why India trusts SpendWise for AI-powered expense tracking, budgeting, and financial insights.",
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    title: "Customer Reviews | SpendWise — India's #1 Expense Tracker",
    description:
      "Read authentic reviews from thousands of happy SpendWise users. See why India trusts SpendWise for AI-powered expense tracking, budgeting, and financial insights.",
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
      "Read authentic reviews from thousands of happy SpendWise users.",
    images: ["/og-images/og-home-dark.png"],
  },
};

export default function ReviewsPage() {
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionStructuredData),
        }}
      />
      <ReviewsClient />
    </>
  );
}
