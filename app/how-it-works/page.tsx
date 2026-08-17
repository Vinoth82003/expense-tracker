import type { Metadata } from "next";
import { HowItWorksClient } from "./HowItWorksClient";

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
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/how-it-works`,
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

const howToStructuredData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Track Expenses with SpendWise",
  "description": "A step-by-step guide to tracking your expenses using SpendWise, the expense tracker built for India.",
  "totalTime": "PT5M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Create Your Free Account",
      "text": "Sign up with Google OAuth or email — no credit card required. Your account is secured with industry-standard encryption.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Log Your Expenses",
      "text": "Add expenses manually with a clean, fast interface. SpendWise auto-categorizes into Needs and Wants.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Get AI Forensic Analysis",
      "text": "SpendWise's behavioral AI analyzes your spending patterns and provides actionable insights beyond simple categorization.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Review Indian Financial Year Reports",
      "text": "View reports aligned to the April–March Indian financial year with Lakhs and Crores formatting for accurate tax planning.",
      "position": 4
    }
  ]
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
