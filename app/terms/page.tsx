import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";
import { SITE_ORIGIN } from "@/lib/site-url";

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
    url: `${SITE_ORIGIN}/terms`,
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
  url: `${SITE_ORIGIN}/terms`,
  dateModified: "2026-06-01",
  publisher: {
    "@type": "Organization",
    name: "SpendWise",
    url: SITE_ORIGIN,
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
      item: SITE_ORIGIN,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Terms of Service",
      item: `${SITE_ORIGIN}/terms`,
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
