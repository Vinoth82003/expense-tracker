import type { Metadata } from "next";
import  DownloadClient  from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download App | SpendWise — Expense Tracker for India",
  description:
    "Install the SpendWise Progressive Web App on Android, iOS, or Desktop. Enjoy offline access to your dashboard and Indian financial year reporting.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "Download App | SpendWise — Expense Tracker for India",
    description:
      "Install the SpendWise Progressive Web App on Android, iOS, or Desktop. Enjoy offline access to your dashboard and Indian financial year reporting.",
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/download`,
    images: [
      {
        url: "/og-images/og-download-dark.png",
        width: 1200,
        height: 630,
        alt: "Download SpendWise App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Download App | SpendWise — Expense Tracker for India",
    description:
      "Install the SpendWise Progressive Web App on Android, iOS, or Desktop. Enjoy offline access to your dashboard and Indian financial year reporting.",
    images: ["/og-images/og-download-dark.png"],
  },
};

const downloadStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SpendWise",
  "description": "AI-powered expense tracker for India. Track spending, set budgets, and gain forensic financial insights.",
  "url": process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  },
  "downloadUrl": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/download`,
  "installFeature": {
    "@type": "SoftwareFeature",
    "name": "PWA Install"
  },
  "screenshot": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/og-images/og-home-dark.png`
};

export default function DownloadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(downloadStructuredData) }}
      />
      <DownloadClient />
    </>
  );
}
