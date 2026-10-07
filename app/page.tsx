import { HomeClient } from "@/components/landing/HomeClient";
import type { PublicStatsData } from "@/components/landing/sections/CounterStats";
import { HOME_FAQS } from "@/components/landing/sections/home-faqs";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import {
  resolveSupportEmail,
  resolveSupportPhone,
} from "@/lib/support-contact";

export default async function Home() {
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

  const baseUrl = siteUrl();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/#softwareapplication`,
    "name": "SpendWise",
    "description": "Expense tracker and budget manager for tracking daily spending, setting monthly budgets, and gaining AI-powered financial insights. Built for the Indian financial year (April–March) with Lakhs and Crores formatting.",
    "url": baseUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web, Mobile PWA",
    "publisher": { "@id": `${baseUrl}/#organization` },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "creator": {
      "@type": "Person",
      "name": "Vinoth S",
      "url": "https://vinoths.vercel.app/"
    },
    "featureList": [
      "Expense tracking with Needs/Wants categorization",
      "Indian financial year (April–March) reporting",
      "Lakhs and Crores formatting",
      "AI-powered forensic spending analysis",
      "Dynamic budget management",
      "PWA offline support",
      "Secure OAuth login",
      "Tax-season PDF export"
    ]
  };

  // FAQPage is built from HOME_FAQS — the exact list the visible FAQSection
  // accordion renders. Structured data that describes FAQs not shown on the
  // page is a manual-action risk (Module 10 parity rule).
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": HOME_FAQS.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "SpendWise",
    "url": baseUrl,
    "logo": `${baseUrl}/web-app-manifest-192x192.png`,
    "description": "Smart AI-powered expense tracker built for India.",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": resolveSupportEmail(),
      "contactType": "customer service",
      ...(resolveSupportPhone()
        ? { telephone: resolveSupportPhone() as string }
        : {}),
    }
  };

  // WebSite schema (Module 10). No SearchAction: the marketing site has no
  // search results page to point it at.
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": "SpendWise",
    "url": baseUrl,
    "inLanguage": "en",
    "publisher": { "@id": `${baseUrl}/#organization` }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <HomeClient stats={stats} />
    </>
  );
}