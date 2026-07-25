import type { Metadata } from "next";
import { FAQClient, FALLBACK_FAQS, type FAQItem } from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Find answers to common questions about SpendWise — AI-powered forensic analysis, expense tracking, budget alerts, data security, exports, and Indian financial year reporting.",
  keywords: [
    "SpendWise FAQ",
    "expense tracker questions",
    "AI expense tracker India",
    "budget tracker help",
    "UPI expense tracker support",
    "financial tracker FAQ",
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ | SpendWise — AI-Powered Expense Tracker",
    description:
      "Find answers to common questions about SpendWise — AI analysis, expense tracking, security, exports, and more.",
    url: "https://money-spend-tracker.vercel.app/faq",
    type: "website",
    siteName: "SpendWise",
    images: [
      {
        url: "/og-images/og-faq-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise FAQ — Frequently Asked Questions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | SpendWise — AI-Powered Expense Tracker",
    description:
      "Find answers to common questions about SpendWise — AI analysis, expense tracking, security, exports, and more.",
    images: ["/og-images/og-faq-dark.png"],
  },
};

async function getFAQs(): Promise<FAQItem[]> {
  try {
    const { prisma } = await import("@/lib/prisma");

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3000)
    );
    const dbQuery = (prisma as any).fAQ?.findMany({ orderBy: { order: "asc" } });

    const rows = await Promise.race([dbQuery, timeout]);
    if (Array.isArray(rows) && rows.length > 0) return rows as FAQItem[];
  } catch {
    // Prisma model may not exist in all environments
  }
  return FALLBACK_FAQS;
}

export default async function FAQPage() {
  const faqs = await getFAQs();

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://money-spend-tracker.vercel.app",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": "https://money-spend-tracker.vercel.app/faq",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <FAQClient faqs={faqs} />
    </>
  );
}
