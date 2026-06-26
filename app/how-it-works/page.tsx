import type { Metadata } from "next";
import { HowItWorksClient } from "./HowItWorksClient";

export const metadata: Metadata = {
  title: "How It Works — SpendWise",
  description:
    "Learn how SpendWise works in 4 simple steps: Secure entry, effortless log, AI forensic analysis, and financial mastery.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works — SpendWise",
    description:
      "Learn how SpendWise works in 4 simple steps: Secure entry, effortless log, AI forensic analysis, and financial mastery.",
    url: "https://money-spend-tracker.vercel.app/how-it-works",
    images: [
      {
        url: "/og-images/og-how-it-works-dark.png",
        width: 1200,
        height: 630,
        alt: "How SpendWise Works",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works — SpendWise",
    description:
      "Learn how SpendWise works in 4 simple steps: Secure entry, effortless log, AI forensic analysis, and financial mastery.",
    images: ["/og-images/og-how-it-works-dark.png"],
  },
};

export default function HowItWorks() {
  return <HowItWorksClient />;
}
