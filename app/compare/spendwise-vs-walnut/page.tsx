import type { Metadata } from "next";
import { CompareClient } from "../CompareClient";

export const metadata: Metadata = {
  title: "SpendWise vs Walnut | Expense Tracker Comparison 2026",
  description:
    "Compare SpendWise vs Walnut (axio) for expense tracking in India. See features, pricing, AI analysis, Indian financial year support, and which app suits your needs better.",
  alternates: {
    canonical: "/compare/spendwise-vs-walnut",
  },
  openGraph: {
    title: "SpendWise vs Walnut | Expense Tracker Comparison 2026",
    description:
      "Compare SpendWise vs Walnut (axio) for expense tracking in India. Features, pricing, AI analysis, and Indian financial year support.",
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/compare/spendwise-vs-walnut`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise vs Walnut Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise vs Walnut | Expense Tracker Comparison 2026",
    description:
      "Compare SpendWise vs Walnut (axio) for expense tracking in India. Features, pricing, AI analysis, and Indian financial year support.",
    images: ["/og-images/og-home-dark.png"],
  },
};

const comparisonStructuredData = {
  "@context": "https://schema.org",
  "@type": "ComparisonPage",
  "name": "SpendWise vs Walnut (axio) — Expense Tracker Comparison",
  "description": "A detailed comparison of SpendWise and Walnut (axio) for expense tracking in India.",
  "url": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/compare/spendwise-vs-walnut`,
  "about": {
    "@type": "SoftwareApplication",
    "name": "SpendWise",
    "applicationCategory": "FinanceApplication"
  },
  "mentions": [
    {
      "@type": "SoftwareApplication",
      "name": "Walnut",
      "alternateName": "axio",
      "applicationCategory": "FinanceApplication"
    }
  ]
};

export default function SpendWiseVsWalnutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonStructuredData) }}
      />
      <CompareClient
        competitor="Walnut"
        competitorAlt="axio"
        slug="spendwise-vs-walnut"
      />
    </>
  );
}
