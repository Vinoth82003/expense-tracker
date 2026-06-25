import type { Metadata } from "next";
import { FAQClient, FALLBACK_FAQS, type FAQItem } from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ – SpendWise",
  description:
    "Find answers to common questions about SpendWise — account setup, security, AI analysis, pricing, and more.",
  openGraph: {
    title: "FAQ – SpendWise",
    description:
      "Find answers to common questions about SpendWise — account setup, security, AI analysis, pricing, and more.",
  },
};

async function getFAQs(): Promise<FAQItem[]> {
  try {
    const { prisma } = await import("@/lib/prisma");

    // Race the DB query against a 3-second timeout to prevent page hanging
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3000)
    );
    const dbQuery = (prisma as any).fAQ?.findMany({ orderBy: { order: "asc" } });

    const rows = await Promise.race([dbQuery, timeout]);
    if (Array.isArray(rows) && rows.length > 0) return rows as FAQItem[];
  } catch {
    // Prisma model may not exist in all environments — fall through
  }
  return FALLBACK_FAQS;
}


export default async function FAQPage() {
  const faqs = await getFAQs();
  return <FAQClient faqs={faqs} />;
}
