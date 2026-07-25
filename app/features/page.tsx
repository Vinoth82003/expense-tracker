import type { Metadata } from "next";
import { FeaturesClient } from "./FeaturesClient";

export const metadata: Metadata = {
  title: "Features | SpendWise — UPI Expense Tracker for India",
  description:
    "Explore SpendWise features — UPI expense tracking, Indian financial year (April–March) reporting, Lakhs/Crores formatting, AI forensic analysis, dynamic budgeting, and PWA offline support.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features | SpendWise — UPI Expense Tracker for India",
    description:
      "Explore SpendWise features — UPI expense tracking, Indian financial year (April–March) reporting, Lakhs/Crores formatting, AI forensic analysis, dynamic budgeting, and PWA offline support.",
    url: "https://money-spend-tracker.vercel.app/features",
    images: [
      {
        url: "/og-images/og-features-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise Features",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | SpendWise — UPI Expense Tracker for India",
    description:
      "Explore SpendWise features — UPI expense tracking, Indian financial year (April–March) reporting, Lakhs/Crores formatting, AI forensic analysis, dynamic budgeting, and PWA offline support.",
    images: ["/og-images/og-features-dark.png"],
  },
};

const featureListStructuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "SpendWise Features",
  "description": "Key features of SpendWise, the AI-powered UPI expense tracker for India.",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "HowToStep",
        "name": "UPI Expense Tracking",
        "text": "Track expenses directly from UPI transactions with automatic categorization."
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "HowToStep",
        "name": "Indian Financial Year Reports",
        "text": "Reports aligned to the April–March Indian financial year for accurate tax planning."
      }
    },
    {
      "@type": "ListItem",
      "position": 3,
      "item": {
        "@type": "HowToStep",
        "name": "Lakhs & Crores Formatting",
        "text": "Native Indian number formatting with Lakhs and Crores for intuitive financial tracking."
      }
    },
    {
      "@type": "ListItem",
      "position": 4,
      "item": {
        "@type": "HowToStep",
        "name": "AI Forensic Analysis",
        "text": "Behavioral AI insights that go beyond simple categorization to reveal spending patterns."
      }
    },
    {
      "@type": "ListItem",
      "position": 5,
      "item": {
        "@type": "HowToStep",
        "name": "PWA Offline Support",
        "text": "Works offline as a Progressive Web App — add expenses without internet, sync when online."
      }
    }
  ]
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featureListStructuredData) }}
      />
      <FeaturesClient />
    </>
  );
}
