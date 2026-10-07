"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { fadeUp } from "./animations";
import { resolveSupportEmail } from "@/lib/support-contact";
import { HOME_FAQS } from "./home-faqs";
import Link from "next/link";

// Shared with the homepage FAQPage JSON-LD (see home-faqs.ts / Module 10).
const faqs = HOME_FAQS;

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
            <a
              href={`mailto:${resolveSupportEmail()}`}
              className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
            >
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

        <p className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
          >
            Browse all FAQs
            <ArrowRight size={15} />
          </Link>
        </p>
      </div>
    </section>
  );
}
