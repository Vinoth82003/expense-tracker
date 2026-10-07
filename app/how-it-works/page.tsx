import type { Metadata } from "next";
import { HowItWorksClient } from "./HowItWorksClient";
import { steps } from "./steps";
import { SITE_ORIGIN } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "How It Works | SpendWise — Expense Tracker for India",
  description:
    "Learn how SpendWise works in 4 simple steps: Secure sign-up, effortless expense tracking, AI forensic analysis, and Indian financial year reporting.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works | SpendWise — Expense Tracker for India",
    description:
      "Learn how SpendWise works in 4 simple steps: Secure sign-up, effortless expense tracking, AI forensic analysis, and Indian financial year reporting.",
    url: `${SITE_ORIGIN}/how-it-works`,
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
    title: "How It Works | SpendWise — Expense Tracker for India",
    description:
      "Learn how SpendWise works in 4 simple steps: Secure sign-up, effortless expense tracking, AI forensic analysis, and Indian financial year reporting.",
    images: ["/og-images/og-how-it-works-dark.png"],
  },
};

// HowTo is built from the shared `steps` array the visible timeline renders
// (Module 10 parity rule). No schema-level duration estimate — setup time is
// not a verified measurement, and fabricated durations are a risk.
const howToStructuredData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Track Expenses with SpendWise",
  "description": "A step-by-step guide to tracking your expenses using SpendWise, the expense tracker built for India.",
  "step": steps.map((step, index) => ({
    "@type": "HowToStep",
    "name": step.title,
    "text": [step.description, ...step.bullets].join(". "),
    "position": index + 1,
  })),
};

export default function HowItWorks() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToStructuredData) }}
      />
      <HowItWorksClient />
    </>
  );
}
