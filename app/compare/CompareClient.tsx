"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  Check,
  X,
  IndianRupee,
  Brain,
  Target,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Globe,
  Lock,
  PieChart,
  Calendar,
  FileText,
} from "lucide-react";

interface CompareClientProps {
  competitor: string;
  competitorAlt: string;
  slug: string;
}

const comparisonData: Record<string, {
  intro: string;
  verdict: string;
  verdictSummary: string;
  features: {
    category: string;
    items: {
      feature: string;
      spendwise: string | boolean;
      competitor: string | boolean;
      spendwiseNote?: string;
      competitorNote?: string;
    }[];
  }[];
  faqs: { q: string; a: string }[];
}> = {
  Walnut: {
    intro: "Walnut (now axio) was one of the first SMS-based expense trackers in India, with over 1 crore downloads. But after its rebrand to axio and pivot toward lending, many users report instability and confusion. SpendWise takes a different approach — a web-first, AI-powered expense tracker built specifically around the Indian financial year.",
    verdict: "SpendWise",
    verdictSummary: "For pure expense tracking with AI insights and Indian FY support, SpendWise is the clearer choice. Walnut/axio has pivoted to lending and its expense tracking has become an afterthought.",
    features: [
      {
        category: "Core Expense Tracking",
        items: [
          { feature: "Manual expense entry", spendwise: true, competitor: true },
          { feature: "UPI transaction tracking", spendwise: "Manual entry with auto-categorization", competitor: "SMS-based parsing" },
          { feature: "Income tracking", spendwise: true, competitor: true },
          { feature: "Receipt scanning", spendwise: false, competitor: false },
          { feature: "Multi-currency support", spendwise: true, competitor: "INR only", spendwiseNote: "With Lakhs/Crores formatting" },
        ],
      },
      {
        category: "Indian Financial Year",
        items: [
          { feature: "April–March FY reports", spendwise: true, competitor: false, spendwiseNote: "Built-in, not an afterthought" },
          { feature: "Lakhs/Crores formatting", spendwise: true, competitor: false },
          { feature: "Tax-season PDF export", spendwise: true, competitor: false },
          { feature: "GST-ready categorization", spendwise: false, competitor: false },
        ],
      },
      {
        category: "AI & Intelligence",
        items: [
          { feature: "AI spending analysis", spendwise: "Forensic behavioral analysis", competitor: "Basic categorization", spendwiseNote: "Goes beyond auto-categorization" },
          { feature: "Anomaly detection", spendwise: true, competitor: false },
          { feature: "Subscription tracking", spendwise: false, competitor: false },
          { feature: "Balance forecasting", spendwise: false, competitor: false },
        ],
      },
      {
        category: "Platform & Access",
        items: [
          { feature: "Web app (no install required)", spendwise: true, competitor: false, spendwiseNote: "PWA with offline support" },
          { feature: "Android app", spendwise: "PWA install", competitor: true },
          { feature: "iOS app", spendwise: "PWA install", competitor: true },
          { feature: "Desktop app", spendwise: "Electron", competitor: false },
          { feature: "Offline support", spendwise: true, competitor: false },
        ],
      },
      {
        category: "Security & Privacy",
        items: [
          { feature: "OAuth login (Google)", spendwise: true, competitor: true },
          { feature: "Two-factor authentication", spendwise: true, competitor: false },
          { feature: "Bank-grade encryption", spendwise: true, competitor: true },
          { feature: "No loan cross-selling", spendwise: true, competitor: false, competitorNote: "axio heavily promotes loans" },
          { feature: "Privacy policy", spendwise: "Transparent privacy policy", competitor: "Basic privacy policy" },
        ],
      },
      {
        category: "Pricing",
        items: [
          { feature: "Free tier", spendwise: "Fully free", competitor: "Free with ads", spendwiseNote: "No hidden fees" },
          { feature: "Premium plan", spendwise: false, competitor: "Required for full features" },
          { feature: "Ad-free experience", spendwise: true, competitor: "Premium only" },
        ],
      },
    ],
    faqs: [
      { q: "Is SpendWise better than Walnut for UPI tracking?", a: "Yes. SpendWise provides a manual expense entry interface with AI-powered auto-categorization. Walnut relies on SMS parsing which is less reliable and has had stability issues since the axio rebrand." },
      { q: "Can I import my Walnut data into SpendWise?", a: "Yes. SpendWise supports CSV import. Export your data from Walnut/axio and import it into SpendWise to get started." },
      { q: "Why did Walnut change to axio?", a: "Walnut rebranded to axio to reflect its pivot from expense tracking to a broader lending and credit platform. This shift has left pure expense tracking as a secondary feature." },
      { q: "Does SpendWise support the Indian financial year?", a: "Yes. SpendWise natively supports the April–March Indian financial year with Lakhs/Crores formatting, tax-season PDF exports, and FY-aligned reports. Walnut uses a standard calendar year." },
    ],
  },
  "ET Money": {
    intro: "ET Money is a comprehensive financial suite covering SIPs, insurance, tax planning, and mutual funds. It's powerful but overwhelming if you just want to track daily expenses. SpendWise focuses exclusively on expense tracking with AI-powered insights, making it the simpler choice for personal finance management.",
    verdict: "SpendWise",
    verdictSummary: "ET Money is great for investments and mutual funds, but if your primary need is expense tracking with AI insights, SpendWise is focused, simpler, and purpose-built for that use case.",
    features: [
      {
        category: "Core Expense Tracking",
        items: [
          { feature: "Manual expense entry", spendwise: true, competitor: true },
          { feature: "UPI transaction tracking", spendwise: "Manual entry with auto-categorization", competitor: "Limited SMS-based" },
          { feature: "Income tracking", spendwise: true, competitor: "Limited" },
          { feature: "Budget management", spendwise: "Dynamic 50/30/20 budgeting", competitor: "Basic budgeting", spendwiseNote: "Needs vs Wants split" },
          { feature: "Multi-currency support", spendwise: true, competitor: "INR only", spendwiseNote: "With Lakhs/Crores formatting" },
        ],
      },
      {
        category: "Indian Financial Year",
        items: [
          { feature: "April–March FY reports", spendwise: true, competitor: false, spendwiseNote: "Native, not added later" },
          { feature: "Lakhs/Crores formatting", spendwise: true, competitor: false },
          { feature: "Tax-season PDF export", spendwise: true, competitor: "Tax saving only" },
          { feature: "80C/80D tracking", spendwise: false, competitor: true, competitorNote: "ET Money's strength" },
        ],
      },
      {
        category: "AI & Intelligence",
        items: [
          { feature: "AI spending analysis", spendwise: "Forensic behavioral analysis", competitor: "Basic insights", spendwiseNote: "Behavioral, not just categorization" },
          { feature: "Anomaly detection", spendwise: true, competitor: false },
          { feature: "Subscription leak detector", spendwise: true, competitor: false },
          { feature: "Predictive balance forecasting", spendwise: true, competitor: false },
          { feature: "Investment recommendations", spendwise: false, competitor: true, competitorNote: "ET Money's core strength" },
        ],
      },
      {
        category: "Platform & Access",
        items: [
          { feature: "Web app (no install required)", spendwise: true, competitor: false, spendwiseNote: "PWA with offline support" },
          { feature: "Android app", spendwise: "PWA install", competitor: true },
          { feature: "iOS app", spendwise: "PWA install", competitor: true },
          { feature: "Offline support", spendwise: true, competitor: false },
        ],
      },
      {
        category: "Security & Privacy",
        items: [
          { feature: "OAuth login (Google)", spendwise: true, competitor: true },
          { feature: "Two-factor authentication", spendwise: true, competitor: false },
          { feature: "Bank-grade encryption", spendwise: true, competitor: true },
          { feature: "No investment cross-selling", spendwise: true, competitor: false, competitorNote: "ET Money pushes SIPs/mutual funds" },
        ],
      },
      {
        category: "Pricing",
        items: [
          { feature: "Free tier", spendwise: "Fully free", competitor: "Free with limitations" },
          { feature: "Premium plan", spendwise: false, competitor: "Required for full features" },
          { feature: "Ad-free experience", spendwise: true, competitor: "Premium only" },
        ],
      },
    ],
    faqs: [
      { q: "Is SpendWise better than ET Money for expense tracking?", a: "Yes, if expense tracking is your primary need. ET Money is a comprehensive financial suite (SIPs, insurance, tax) that includes expense tracking as one feature. SpendWise focuses exclusively on expense tracking with deeper AI analysis." },
      { q: "Does ET Money have AI analysis like SpendWise?", a: "ET Money provides basic spending insights. SpendWise's forensic AI goes deeper — detecting anomalies and providing behavioral spending patterns that ET Money doesn't offer." },
      { q: "Can I use both SpendWise and ET Money together?", a: "Absolutely. Many users use ET Money for investments and SIPs while using SpendWise for daily expense tracking and budget management. They complement each other well." },
      { q: "Does SpendWise support tax planning like ET Money?", a: "SpendWise provides tax-season PDF exports aligned to the Indian financial year (April–March) with GST-ready categorization. For detailed 80C/80D investment planning, ET Money is more specialized." },
    ],
  },
};

const fadeUp = {
  hidden: { y: 32, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

export function CompareClient({ competitor, competitorAlt, slug }: CompareClientProps) {
  const data = comparisonData[competitor] || comparisonData.Walnut;

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-0 min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          {/* Hero */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-20 mt-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
              Comparison
            </div>
            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
              SpendWise vs{" "}
              <span className="text-primary-600">{competitor}</span>
            </h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
              {data.intro}
            </p>
          </motion.section>

          {/* Verdict Banner */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-16 p-8 bg-gradient-to-r from-primary-500/10 to-violet-500/10 border border-primary-500/20 rounded-[2rem] text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 mb-2">
              Our Verdict
            </p>
            <p className="text-[24px] md:text-[28px] font-bold text-foreground mb-2">
              {data.verdict} Wins
            </p>
            <p className="text-secondary font-medium max-w-xl mx-auto">
              {data.verdictSummary}
            </p>
          </motion.div>

          {/* Feature Comparison Tables */}
          {data.features.map((section, sIdx) => (
            <motion.section
              key={section.category}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: sIdx * 0.05 }}
              className="mb-12"
            >
              <h2 className="text-[18px] font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 text-[13px] font-bold">
                  {sIdx + 1}
                </span>
                {section.category}
              </h2>
              <div className="bg-surface border border-border-subtle rounded-[1.5rem] overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 p-4 border-b border-border-subtle bg-surface-variant/30">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Feature
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 text-center">
                    SpendWise
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted text-center">
                    {competitor}
                  </div>
                </div>
                {/* Rows */}
                {section.items.map((item, i) => (
                  <div
                    key={item.feature}
                    className={`grid grid-cols-3 gap-4 p-4 items-center ${i < section.items.length - 1 ? "border-b border-border-subtle/50" : ""}`}
                  >
                    <div className="text-sm font-bold text-foreground">
                      {item.feature}
                    </div>
                    <div className="text-center">
                      {typeof item.spendwise === "boolean" ? (
                        item.spendwise ? (
                          <Check
                            size={18}
                            className="mx-auto text-emerald-500"
                          />
                        ) : (
                          <X size={18} className="mx-auto text-red-400" />
                        )
                      ) : (
                        <div>
                          <span className="text-xs font-bold text-primary-600">
                            {item.spendwise}
                          </span>
                          {item.spendwiseNote && (
                            <p className="text-[10px] text-muted mt-0.5">
                              {item.spendwiseNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof item.competitor === "boolean" ? (
                        item.competitor ? (
                          <Check
                            size={18}
                            className="mx-auto text-emerald-500"
                          />
                        ) : (
                          <X size={18} className="mx-auto text-red-400" />
                        )
                      ) : (
                        <div>
                          <span className="text-xs font-bold text-secondary">
                            {item.competitor}
                          </span>
                          {item.competitorNote && (
                            <p className="text-[10px] text-muted mt-0.5">
                              {item.competitorNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}

          {/* CTA */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mt-20 mb-16"
          >
            <h2 className="text-[28px] md:text-[36px] font-bold text-foreground mb-4">
              Ready to try SpendWise?
            </h2>
            <p className="text-secondary font-medium mb-8 max-w-lg mx-auto">
              Join thousands of Indians tracking their expenses with AI-powered
              insights and Indian financial year reporting.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-primary-600 text-white text-[16px] font-bold shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[52px]"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
          </motion.section>

          {/* FAQ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-16"
          >
            <h2 className="text-[22px] font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {data.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-border-subtle bg-surface shadow-sm"
                >
                  <h3 className="font-bold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-secondary font-medium leading-relaxed text-[14px]">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Related Comparisons */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-16 text-center pb-16"
          >
            <p className="text-[13px] text-muted font-semibold mb-4">
              More Comparisons
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {slug !== "spendwise-vs-walnut" && (
                <Link
                  href="/compare/spendwise-vs-walnut"
                  className="px-5 py-2.5 bg-surface border border-border-subtle rounded-xl text-[13px] font-bold text-secondary hover:text-primary-600 hover:border-primary-500/30 transition-all"
                >
                  vs Walnut (axio)
                </Link>
              )}
              {slug !== "spendwise-vs-et-money" && (
                <Link
                  href="/compare/spendwise-vs-et-money"
                  className="px-5 py-2.5 bg-surface border border-border-subtle rounded-xl text-[13px] font-bold text-secondary hover:text-primary-600 hover:border-primary-500/30 transition-all"
                >
                  vs ET Money
                </Link>
              )}
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </>
  );
}
