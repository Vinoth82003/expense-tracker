import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Review the Terms of Service for SpendWise. Learn about personal use rules, data ownership, third-party integrations, and governing laws.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title:
      "Terms of Service | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Review the Terms of Service for SpendWise. Learn about personal use rules, data ownership, third-party integrations, and governing laws.",
    url: "https://money-spend-tracker.vercel.app/terms",
    images: [
      {
        url: "/og-images/og-terms-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Terms of Service | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Review the Terms of Service for SpendWise. Learn about personal use rules, data ownership, third-party integrations, and governing laws.",
    images: ["/og-images/og-terms-dark.png"],
  },
};

const termsStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms of Service",
  description:
    "SpendWise Terms of Service — personal use rules, data ownership, third-party integrations, and governing laws.",
  url: "https://money-spend-tracker.vercel.app/terms",
  dateModified: "2026-06-01",
  publisher: {
    "@type": "Organization",
    name: "SpendWise",
    url: "https://money-spend-tracker.vercel.app",
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://money-spend-tracker.vercel.app",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Terms of Service",
      item: "https://money-spend-tracker.vercel.app/terms",
    },
  ],
};

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(termsStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <TermsClient />
    </>
  );
}
