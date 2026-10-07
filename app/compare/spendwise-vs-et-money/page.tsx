import type { Metadata } from "next";
import { CompareClient } from "../CompareClient";
import { SITE_ORIGIN } from "@/lib/site-url";
import { breadcrumbJsonLd } from "@/components/seo/SiteBreadcrumbs";

export const metadata: Metadata = {
  title: "SpendWise vs ET Money | Expense Tracker Comparison 2026",
  description:
    "Compare SpendWise vs ET Money for personal finance management in India. See which app offers better expense tracking, AI insights, budgeting tools, and Indian financial year support.",
  alternates: {
    canonical: "/compare/spendwise-vs-et-money",
  },
  openGraph: {
    title: "SpendWise vs ET Money | Expense Tracker Comparison 2026",
    description:
      "Compare SpendWise vs ET Money for personal finance management in India. Expense tracking, AI insights, budgeting tools, and Indian financial year support.",
    url: `${SITE_ORIGIN}/compare/spendwise-vs-et-money`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise vs ET Money Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise vs ET Money | Expense Tracker Comparison 2026",
    description:
      "Compare SpendWise vs ET Money for personal finance management in India. Expense tracking, AI insights, budgeting tools, and Indian financial year support.",
    images: ["/og-images/og-home-dark.png"],
  },
};

const comparisonStructuredData = {
  "@context": "https://schema.org",
  "@type": "ComparisonPage",
  "name": "SpendWise vs ET Money — Expense Tracker Comparison",
  "description": "A detailed comparison of SpendWise and ET Money for personal finance management in India.",
  "url": `${SITE_ORIGIN}/compare/spendwise-vs-et-money`,
  "about": {
    "@type": "SoftwareApplication",
    "name": "SpendWise",
    "applicationCategory": "FinanceApplication"
  },
  "mentions": [
    {
      "@type": "SoftwareApplication",
      "name": "ET Money",
      "applicationCategory": "FinanceApplication"
    }
  ]
};

const breadcrumbStructuredData = breadcrumbJsonLd(SITE_ORIGIN, [
  { name: "Home", path: "/" },
  { name: "Compare", path: "/sitemap" },
  { name: "SpendWise vs ET Money", path: "/compare/spendwise-vs-et-money" },
]);

export default function SpendWiseVsETMoneyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <CompareClient
        competitor="ET Money"
        competitorAlt="ET Money"
        slug="spendwise-vs-et-money"
      />
    </>
  );
}
