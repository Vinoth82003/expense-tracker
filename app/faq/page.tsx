import type { Metadata } from "next";
import { FAQClient, FALLBACK_FAQS, type FAQItem } from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Find answers to common questions about SpendWise — AI-powered forensic analysis, expense tracking, budget alerts, data security, exports, and Indian financial year reporting.",
};

async function getFAQs(): Promise<FAQItem[]> {
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
        "item": process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://money-spend-tracker.vercel.app"}/faq`,
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
