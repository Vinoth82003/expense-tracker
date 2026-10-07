import type { Metadata } from "next";
import { EmergencyFundClient } from "./EmergencyFundClient";
import { SITE_ORIGIN } from "@/lib/site-url";
import { breadcrumbJsonLd } from "@/components/seo/SiteBreadcrumbs";

export const metadata: Metadata = {
  title: "Emergency Fund Calculator | Safety Net Planner | SpendWise",
  description:
    "Free emergency fund calculator in Indian Rupees (₹). Enter your monthly essential expenses to find your target corpus and the monthly saving needed to build it.",
  alternates: {
    canonical: "/tools/emergency-fund-calculator",
  },
  openGraph: {
    title: "Emergency Fund Calculator | Safety Net Planner | SpendWise",
    description:
      "Free emergency fund calculator in Indian Rupees. Find your target corpus and monthly saving from your essential expenses.",
    url: `${SITE_ORIGIN}/tools/emergency-fund-calculator`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "Emergency Fund Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emergency Fund Calculator | SpendWise",
    description:
      "Free emergency fund calculator in Indian Rupees. Find your target corpus and monthly saving from your essential expenses.",
    images: ["/og-images/og-home-dark.png"],
  },
};

const calculatorStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Emergency Fund Calculator",
  "description":
    "A free calculator that estimates an emergency fund corpus in Indian Rupees from monthly essential expenses, desired months of cover, and the time available to build it.",
  "url": `${SITE_ORIGIN}/tools/emergency-fund-calculator`,
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
  },
  "provider": {
    "@type": "Organization",
    "name": "SpendWise",
    "url": SITE_ORIGIN,
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How big should my emergency fund be?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A common guideline is 3 to 6 months of essential expenses. If your income is variable or you support a family, 6 to 12 months offers more cushion. Pick the cover that matches your situation in the calculator.",
      },
    },
    {
      "@type": "Question",
      "name": "Where should I keep my emergency fund?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Somewhere you can withdraw from quickly without losing value: a high-interest savings account or a liquid fund. Avoid locking it in fixed deposits with penalties for early withdrawal.",
      },
    },
    {
      "@type": "Question",
      "name": "Should I save for an emergency fund or invest first?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Build a small emergency buffer first (even 1 month of expenses), then invest while you continue building the fund. The safety net comes first because it keeps you from borrowing at high interest when something unexpected happens.",
      },
    },
  ],
};

const breadcrumbStructuredData = breadcrumbJsonLd(SITE_ORIGIN, [
  { name: "Home", path: "/" },
  { name: "Tools", path: "/tools" },
  { name: "Emergency Fund Calculator", path: "/tools/emergency-fund-calculator" },
]);

export default function EmergencyFundCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <EmergencyFundClient />
    </>
  );
}
