import type { Metadata } from "next";
import { DownloadClient } from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download App — SpendWise",
  description:
    "Download the SpendWise native PWA application for Android, iOS, or Desktop. Enjoy offline tracking, face/touch ID login, and fullscreen view.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "Download App — SpendWise",
    description:
      "Download the SpendWise native PWA application for Android, iOS, or Desktop. Enjoy offline tracking, face/touch ID login, and fullscreen view.",
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
    title: "Download App — SpendWise",
    description:
      "Download the SpendWise native PWA application for Android, iOS, or Desktop. Enjoy offline tracking, face/touch ID login, and fullscreen view.",
    images: ["/og-images/og-download-dark.png"],
  },
};

export default function DownloadPage() {
  return <DownloadClient />;
}
