import type { Metadata } from "next";
import { FAQClient, type FAQItem } from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Find answers to common questions about SpendWise — AI-powered forensic analysis, expense tracking, budget alerts, data security, exports, and Indian financial year reporting.",
};

const FAQS: FAQItem[] = [
  { id: "1", question: "How do I create an account?", answer: "Click 'Sign Up' on the homepage and use Google Auth to create your account instantly.", category: "General", order: 1 },
  { id: "2", question: "Is my financial data secure?", answer: "All data is encrypted in transit using industry-standard TLS. We use Google OAuth 2.0 for authentication, bcrypt password hashing for email accounts, and optional 2FA.", category: "Security & Privacy", order: 2 },
  { id: "3", question: "Can I export my expense data?", answer: "Yes. You can export all your expenses and income as a CSV file from the Settings page. The AI analysis report can also be downloaded as a PDF.", category: "Features & Support", order: 3 },
  { id: "4", question: "How does the AI analysis work?", answer: "SpendWise sends your expense history to Google Gemini, which generates a structured report covering spending patterns, budget advice, and actionable suggestions. Notes are sanitized before sending.", category: "Features & Support", order: 4 },
  { id: "5", question: "What if I forget my password?", answer: "Sign in with Google for instant access, or create an account with email and password. Optional 2FA is available for extra security.", category: "General", order: 5 },
  { id: "6", question: "Do you share my data with third parties?", answer: "No. Your data never leaves your account unless you explicitly export it. We never sell or share financial data with anyone.", category: "Security & Privacy", order: 6 },
  { id: "7", question: "How can I contact support?", answer: "Use the 'Message Support' button below or email our support team. We typically respond within 24 hours.", category: "General", order: 7 },
  { id: "8", question: "Is there a free tier?", answer: "Yes. SpendWise offers a free plan with core tracking, budgeting, and AI insights. No hidden fees, no credit card required to get started.", category: "Features & Support", order: 8 },
];

async function getFAQs(): Promise<FAQItem[]> {
  return FAQS;
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
        "item": process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/faq`,
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
