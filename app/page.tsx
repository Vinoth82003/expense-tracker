import { HomeClient } from "@/components/landing/HomeClient";
import { prisma } from "@/lib/prisma";

const defaultFaqs = [
  {
    question: "Is SpendWise free to use?",
    answer: "Yes, SpendWise is completely free for personal use. No hidden fees or premium subscriptions.",
    category: "General"
  },
  {
    question: "How secure is my data?",
    answer: "Your data is encrypted and stored securely. We use OAuth authentication and never store passwords.",
    category: "Security"
  },
  {
    question: "Can I export my expense data?",
    answer: "Yes, you can export your expenses to CSV format for tax purposes or personal records.",
    category: "Features"
  },
  {
    question: "Does it work offline?",
    answer: "Yes, SpendWise is a PWA that works offline. You can add expenses without internet and sync when online.",
    category: "Features"
  },
  {
    question: "What currencies does it support?",
    answer: "SpendWise supports multiple currencies with Rupee (₹) as the primary currency for Indian users.",
    category: "Features"
  },
  {
    question: "Can I categorize my expenses?",
    answer: "Yes, expenses are categorized into Needs and Wants with detailed subcategories for better tracking.",
    category: "Features"
  }
];

export default async function Home() {
  const dbFaqs = await prisma.fAQ.findMany({ orderBy: { order: 'asc' } });
  const faqs = dbFaqs.length > 0 ? dbFaqs : defaultFaqs;

  const baseUrl = process.env.NEXTAUTH_URL || "https://money-spend-tracker.vercel.app";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SpendWise",
    "description": "India's best UPI expense tracker for tracking daily expenses, setting monthly budgets, and gaining AI-powered financial insights. Built for the Indian financial year (April–March) with Lakhs and Crores formatting.",
    "url": baseUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web, Mobile PWA",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "creator": {
      "@type": "Person",
      "name": "Vinoth"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000"
    },
    "featureList": [
      "UPI expense tracking",
      "Indian financial year (April–March) reporting",
      "Lakhs and Crores formatting",
      "AI-powered forensic spending analysis",
      "Dynamic budget management",
      "PWA offline support",
      "Secure OAuth login",
      "Tax-season PDF export"
    ]
  };
    
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SpendWise",
    "url": baseUrl,
    "logo": `${baseUrl}/web-app-manifest-192x192.png`,
    "description": "Smart AI-powered expense tracker built for India.",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@spendwise.app",
      "contactType": "customer service"
    }
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
      <HomeClient />
    </>
  );
}