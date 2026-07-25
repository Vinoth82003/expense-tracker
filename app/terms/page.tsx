import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service | SpendWise — UPI Expense Tracker for India",
  description:
    "Review the Terms of Service for SpendWise. Learn about personal use rules, data ownership, third-party integrations, and governing laws.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | SpendWise — UPI Expense Tracker for India",
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
    title: "Terms of Service | SpendWise — UPI Expense Tracker for India",
    description:
      "Review the Terms of Service for SpendWise. Learn about personal use rules, data ownership, third-party integrations, and governing laws.",
    images: ["/og-images/og-terms-dark.png"],
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
