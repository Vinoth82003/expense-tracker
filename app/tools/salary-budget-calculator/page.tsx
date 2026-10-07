import type { Metadata } from "next";
import { SalaryBudgetClient } from "./SalaryBudgetClient";
import { SITE_ORIGIN } from "@/lib/site-url";
import { breadcrumbJsonLd } from "@/components/seo/SiteBreadcrumbs";

export const metadata: Metadata = {
  title: "Salary Budget Calculator | Daily Spending Planner | SpendWise",
  description:
    "Free salary budget calculator in Indian Rupees (₹). Enter your take-home pay, fixed commitments and savings goal to get a daily spending allowance for the month.",
  alternates: {
    canonical: "/tools/salary-budget-calculator",
  },
  openGraph: {
    title: "Salary Budget Calculator | Daily Spending Planner | SpendWise",
    description:
      "Free salary budget calculator in Indian Rupees. Get a daily spending allowance from your take-home pay, commitments, and savings goal.",
    url: `${SITE_ORIGIN}/tools/salary-budget-calculator`,
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "Salary Budget Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salary Budget Calculator | SpendWise",
    description:
      "Free salary budget calculator in Indian Rupees. Get a daily spending allowance from your take-home pay, commitments, and savings goal.",
    images: ["/og-images/og-home-dark.png"],
  },
};

const calculatorStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Salary Budget Calculator",
  "description":
    "A free calculator that turns monthly take-home salary, fixed commitments, and a savings goal into a daily spending allowance in Indian Rupees.",
  "url": `${SITE_ORIGIN}/tools/salary-budget-calculator`,
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
  },
  "provider": {
    "@type": "Organization",
    "name": "SpendWise",
    "url": SITE_ORIGIN,
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I budget my monthly salary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start with your take-home pay. Set aside your savings goal first, subtract fixed commitments (rent, EMIs, bills), and divide what remains by the days in the month. That gives you a safe daily spending amount.",
      },
    },
    {
      "@type": "Question",
      "name": "What counts as a fixed commitment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Recurring amounts you must pay each month: rent, loan EMIs, utility bills, insurance premiums, and school fees. One-off spending like gifts or travel belongs in your daily pool, not here.",
      },
    },
    {
      "@type": "Question",
      "name": "How much of my salary should I save?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "There is no single right answer. A common starting point is the 50/30/20 rule (20% to savings), adjusted for your city, income, and goals. The calculator shows your current savings rate so you can see where you stand.",
      },
    },
  ],
};

const breadcrumbStructuredData = breadcrumbJsonLd(SITE_ORIGIN, [
  { name: "Home", path: "/" },
  { name: "Tools", path: "/tools" },
  { name: "Salary Budget Calculator", path: "/tools/salary-budget-calculator" },
]);

export default function SalaryBudgetCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <SalaryBudgetClient />
    </>
  );
}
