import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Get in touch with the SpendWise support team. Send us a message, email support@spendwise.app, or call our Indian helpline. We respond within 24 hours.",
  keywords: [
    "SpendWise contact",
    "expense tracker support",
    "SpendWise help",
    "contact SpendWise India",
    "budget tracker support",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | SpendWise — AI-Powered Expense Tracker",
    description:
      "Get in touch with the SpendWise support team. Send us a message, email support@spendwise.app, or call our Indian helpline.",
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/contact`,
    type: "website",
    siteName: "SpendWise",
    images: [
      {
        url: "/og-images/og-contact-dark.png",
        width: 1200,
        height: 630,
        alt: "Contact SpendWise Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | SpendWise — AI-Powered Expense Tracker",
    description:
      "Get in touch with the SpendWise support team. Send us a message, email support@spendwise.app, or call our Indian helpline.",
    images: ["/og-images/og-contact-dark.png"],
  },
};

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact SpendWise",
  "description": "Get in touch with the SpendWise support team.",
  "url": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/contact`,
  "mainEntity": {
    "@type": "Organization",
    "name": "SpendWise",
    "email": "support@spendwise.app",
    "url": process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app",
  },
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
        "item": process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Contact",
      "item": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/contact`,
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <ContactClient />
    </>
  );
}
