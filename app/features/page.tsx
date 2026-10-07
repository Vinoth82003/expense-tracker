import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { PublicStatsData } from "@/components/landing/sections/CounterStats";
import { FeaturesClient } from "./FeaturesClient";
import { faqs } from "./_data";
import { SITE_ORIGIN } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Features | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Explore SpendWise features — manual expense & income tracking, AI-powered forensic analysis, natural language chat input, smart budgeting with 50/30/20 analysis, interactive reports, and group expense splitting.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Explore SpendWise features — manual expense & income tracking, AI-powered forensic analysis, natural language chat input, smart budgeting with 50/30/20 analysis, interactive reports, and group expense splitting.",
    url: `${SITE_ORIGIN}/features`,
    images: [
      {
        url: "/og-images/og-features-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise Features",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | SpendWise — AI-Powered Expense Tracker for India",
    description:
      "Explore SpendWise features — manual expense & income tracking, AI-powered forensic analysis, natural language chat input, smart budgeting with 50/30/20 analysis, interactive reports, and group expense splitting.",
    images: ["/og-images/og-features-dark.png"],
  },
};

const featureListStructuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SpendWise Features",
  description:
    "Key features of SpendWise, the AI-powered expense tracker for India.",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "HowToStep",
        name: "Expense & Income Tracking",
        text: "Log expenses and income manually with Needs/Wants categorization, custom subcategories, search, date filtering, and CSV export.",
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "HowToStep",
        name: "AI Forensic Analysis",
        text: "Google Gemini or Groq generates structured financial reports covering spending patterns, budget burn-rate, income trends, and actionable savings suggestions.",
      },
    },
    {
      "@type": "ListItem",
      position: 3,
      item: {
        "@type": "HowToStep",
        name: "Natural Language Chat",
        text: "Add expenses and query summaries by typing naturally. The intent-based system handles multi-turn conversations with auto-categorization.",
      },
    },
    {
      "@type": "ListItem",
      position: 4,
      item: {
        "@type": "HowToStep",
        name: "Smart Budgeting",
        text: "Set a monthly budget limit with real-time tracking, email alerts at 80% threshold, and 50/30/20 rule analysis with radar charts.",
      },
    },
    {
      "@type": "ListItem",
      position: 5,
      item: {
        "@type": "HowToStep",
        name: "Interactive Reports",
        text: "Recharts-powered visualizations with area, bar, radar, and donut charts. View by day, week, month, or custom range with period comparison.",
      },
    },
    {
      "@type": "ListItem",
      position: 6,
      item: {
        "@type": "HowToStep",
        name: "Group Expense Splitting",
        text: "Create groups, log shared expenses with equal/count/custom splits, track balances, and manage payment status across members.",
      },
    },
  ],
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  // Built from the same `_data.faqs` array the visible FeatureFAQ section
  // renders (Module 10 parity rule) — never a separate hand-maintained copy.
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default async function FeaturesPage() {
  const stats: PublicStatsData = await (async () => {
    try {
      const [totalUsers, totalExpenses, reviewAgg] = await Promise.all([
        prisma.user.count(),
        prisma.expense.count(),
        prisma.review.aggregate({
          where: { status: "APPROVED" },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);
      return {
        totalUsers,
        totalExpenses,
        avgRating: reviewAgg._avg.rating
          ? Number(reviewAgg._avg.rating.toFixed(1))
          : null,
        ratingCount: reviewAgg._count.rating,
      };
    } catch {
      return { totalUsers: 0, totalExpenses: 0, avgRating: null, ratingCount: 0 };
    }
  })();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(featureListStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <FeaturesClient stats={stats} />
    </>
  );
}
