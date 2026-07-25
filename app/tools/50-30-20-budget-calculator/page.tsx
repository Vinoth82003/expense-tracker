import type { Metadata } from "next";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "50/30/20 Budget Calculator | Free Indian Expense Planner | SpendWise",
  description:
    "Calculate your ideal 50/30/20 budget split in Indian Rupees (₹). Enter your monthly income and instantly see how much to spend on Needs, Wants, and Savings. Supports Lakhs/Crores formatting and Indian financial year planning.",
  alternates: {
    canonical: "/tools/50-30-20-budget-calculator",
  },
  openGraph: {
    title: "50/30/20 Budget Calculator | Free Indian Expense Planner | SpendWise",
    description:
      "Calculate your ideal 50/30/20 budget split in Indian Rupees. Enter your monthly income and see Needs, Wants, and Savings amounts instantly.",
    url: "https://money-spend-tracker.vercel.app/tools/50-30-20-budget-calculator",
    type: "website",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "50/30/20 Budget Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "50/30/20 Budget Calculator | Free Indian Expense Planner",
    description:
      "Calculate your ideal 50/30/20 budget split in Indian Rupees. Enter your monthly income and see Needs, Wants, and Savings amounts instantly.",
    images: ["/og-images/og-home-dark.png"],
  },
};

const calculatorStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "50/30/20 Budget Calculator",
  "description": "A free calculator to split your monthly income into Needs (50%), Wants (30%), and Savings (20%) in Indian Rupees with Lakhs/Crores formatting.",
  "url": "https://money-spend-tracker.vercel.app/tools/50-30-20-budget-calculator",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  },
  "provider": {
    "@type": "Organization",
    "name": "SpendWise",
    "url": "https://money-spend-tracker.vercel.app"
  }
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the 50/30/20 budget rule?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The 50/30/20 rule is a simple budgeting framework where you divide your after-tax income into three categories: 50% for Needs (rent, groceries, bills), 30% for Wants (entertainment, dining out, hobbies), and 20% for Savings & Debt Repayment."
      }
    },
    {
      "@type": "Question",
      "name": "How do I calculate my 50/30/20 budget in Indian Rupees?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Enter your monthly after-tax income in the calculator above. It will automatically split it: 50% for Needs, 30% for Wants, and 20% for Savings. For example, if your monthly income is ₹50,000, you should spend ₹25,000 on Needs, ₹15,000 on Wants, and save ₹10,000."
      }
    },
    {
      "@type": "Question",
      "name": "Is the 50/30/20 rule suitable for Indian salaries?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, the 50/30/20 rule works well for Indian salaries. It's flexible — if you live in a high-cost city like Mumbai or Bangalore, you might adjust to 60/20/20. The key is maintaining at least 20% for savings and investments."
      }
    },
    {
      "@type": "Question",
      "name": "What counts as 'Needs' in the 50/30/20 rule?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Needs include: rent/EMI, groceries, utilities (electricity, water, internet), transportation, insurance premiums, minimum debt payments, and essential medical expenses. These are expenses you cannot avoid."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use this calculator for annual financial year planning?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Multiply your monthly budget amounts by 12 to get your annual Indian financial year (April–March) budget. The calculator also shows your annual breakdown to help with FY planning and tax-season preparation."
      }
    }
  ]
};

export default function BudgetCalculatorPage() {
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
      <CalculatorClient />
    </>
  );
}
