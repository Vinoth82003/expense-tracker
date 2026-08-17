import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Read the SpendWise Privacy Policy. Learn about our commitment to data protection, compliance with the Indian DPDP Act 2023, data retention, and how to contact our Grievance Officer.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Read the SpendWise Privacy Policy. Learn about our commitment to data protection, compliance with the Indian DPDP Act 2023, data retention, and how to contact our Grievance Officer.",
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/privacy`,
    images: [
      {
        url: "/og-images/og-privacy-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Read the SpendWise Privacy Policy. Learn about our commitment to data protection, compliance with the Indian DPDP Act 2023, data retention, and how to contact our Grievance Officer.",
    images: ["/og-images/og-privacy-dark.png"],
  },
};

const privacyStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy",
  description:
    "SpendWise Privacy Policy — data protection, DPDP Act 2023 compliance, data retention, and Grievance Officer contact.",
  url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/privacy`,
  dateModified: "2026-06-01",
  publisher: {
    "@type": "Organization",
    name: "SpendWise",
    url: process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app",
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
      item: process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Privacy Policy",
      item: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/privacy`,
    },
  ],
};

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(privacyStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <PrivacyClient />
    </>
  );
}
