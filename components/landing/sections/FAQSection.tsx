"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { fadeUp } from "./animations";

const faqs = [
  {
    q: "What is SpendWise?",
    a: "SpendWise is a smart expense tracker built for India. It auto-categorizes your expenses, tracks budgets in real time, and gives you AI-powered insights into where your money goes — all from your phone.",
  },
  {
    q: "How does Sage AI work?",
    a: "Sage AI analyzes your actual transactions to surface spending patterns, detect anomalies, and answer plain-language questions like \"Where did my money go this month?\" Every number it shows comes directly from your tracked data — no guessed or fabricated stats.",
  },
  {
    q: "Is SpendWise free to use?",
    a: "Yes. SpendWise offers a free plan with core tracking, budgeting, and AI insights. No hidden fees, no credit card required to get started.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. We use Google OAuth 2.0 for authentication, encrypt all data in transit, and use secure password hashing. Your data stays in your account — we never share it with third parties.",
  },
  {
    q: "Can teams use SpendWise?",
    a: "SpendWise is designed for personal finance tracking. For team or business expense management, check out our Groups feature for splitting shared expenses with friends and family.",
  },
  {
    q: "How accurate is the AI?",
    a: "Sage AI only works with your real transaction data. It doesn't hallucinate numbers or invent categories — every insight, breakdown, and recommendation is grounded in transactions you've actually recorded.",
  },
  {
    q: "How long does setup take?",
    a: "About 2 minutes. Sign in with Google, and you're ready to start logging expenses. No lengthy onboarding or complex configuration needed.",
  },
  {
    q: "Does SpendWise support recurring expenses?",
    a: "Currently, SpendWise supports manual expense entry. You can log subscriptions, rent, EMIs, and SIPs as regular expenses and track them in your reports.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[720px] mx-auto">
        {/* ── Headline ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <HelpCircle size={12} className="text-primary-500" />
            FAQ
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground">
            Questions?{" "}
            <span className="text-primary-600">Answers.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[500px] text-[15px] leading-relaxed text-secondary">
            Everything you need to know about SpendWise. Can&apos;t find what you&apos;re looking for?{" "}
            <a href="mailto:support@spendwise.app" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">
              Email us
            </a>
          </p>
        </motion.div>

        {/* ── Accordion card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden"
        >
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left min-h-[56px] hover:bg-surface-variant/40 transition-colors duration-150"
                >
                  <span className="text-[14px] md:text-[15px] font-semibold text-foreground leading-snug">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    <ChevronDown
                      size={18}
                      className="text-muted"
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 py-6 text-[13px] md:text-[14px] text-secondary leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* {i < faqs.length - 1 && (
                  <div className="border-b border-border-subtle/60 mx-6" />
                )} */}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
