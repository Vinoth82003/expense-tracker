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
    const rows = await (prisma as any).fAQ?.findMany({
      orderBy: { order: "asc" },
    });
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
