import type { Metadata } from "next";
import  DownloadClient  from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download App | SpendWise — UPI Expense Tracker for India",
  description:
    "Download the SpendWise native PWA application for Android, iOS, or Desktop. Enjoy offline UPI tracking, face/touch ID login, and Indian financial year reporting.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "Download App | SpendWise — UPI Expense Tracker for India",
    description:
      "Download the SpendWise native PWA application for Android, iOS, or Desktop. Enjoy offline UPI tracking, face/touch ID login, and Indian financial year reporting.",
    url: "https://money-spend-tracker.vercel.app/download",
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
    title: "Download App | SpendWise — UPI Expense Tracker for India",
    description:
      "Download the SpendWise native PWA application for Android, iOS, or Desktop. Enjoy offline UPI tracking, face/touch ID login, and Indian financial year reporting.",
    images: ["/og-images/og-download-dark.png"],
  },
};

const downloadStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SpendWise",
  "description": "AI-powered UPI expense tracker for India. Track spending, set budgets, and gain forensic financial insights.",
  "url": "https://money-spend-tracker.vercel.app",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  },
  "downloadUrl": "https://money-spend-tracker.vercel.app/download",
  "installFeature": {
    "@type": "SoftwareFeature",
    "name": "PWA Install"
  },
  "screenshot": "https://money-spend-tracker.vercel.app/og-images/og-home-dark.png"
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
