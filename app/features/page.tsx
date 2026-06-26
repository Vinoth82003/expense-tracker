import type { Metadata } from "next";
import { FeaturesClient } from "./FeaturesClient";

export const metadata: Metadata = {
  title: "Features — SpendWise",
  description:
    "Explore SpendWise features — Rupee-ready intelligence, forensic AI analysis, dynamic budgeting, native PWA, and secure bank-grade security.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features — SpendWise",
    description:
      "Explore SpendWise features — Rupee-ready intelligence, forensic AI analysis, dynamic budgeting, native PWA, and secure bank-grade security.",
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
    title: "Features — SpendWise",
    description:
      "Explore SpendWise features — Rupee-ready intelligence, forensic AI analysis, dynamic budgeting, native PWA, and secure bank-grade security.",
    images: ["/og-images/og-features-dark.png"],
  },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
