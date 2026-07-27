"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Star,
  HelpCircle,
  ChevronDown,
  Check,
  Minus,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CounterStats } from "@/components/landing/sections/CounterStats";
import { fadeUp } from "@/components/landing/sections/animations";
import { features, faqs, comparisonRows } from "./_data";

/* ──────────── Separator ──────────── */

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

/* ──────────── Feature Deep Dive (2-col card grid) ──────────── */

function FeatureDeepDive() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1120px] mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <Sparkles size={12} className="text-primary-500" />
            Features
          </div>
          <h2 className="mx-auto mb-5 max-w-[700px] text-[28px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] lg:text-[44px]">
            Built for India.{" "}
            <span className="text-primary-600">Designed for you.</span>
          </h2>
          <p className="mx-auto max-w-[500px] text-[15px] leading-relaxed text-secondary">
            Six core capabilities. Zero bloat. Every feature is built for the
            Indian economy — from expense tracking to Lakhs &amp; Crores formatting.
          </p>
        </motion.div>

        {/* 2-col card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(i * 0.06, 0.3),
                  ease: "easeOut",
                }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-lg hover:border-primary-500/20 transition-all"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${feat.iconBg} ${feat.iconColor}`}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-[13px] text-secondary font-medium leading-relaxed mb-5">
                  {feat.description}
                </p>
                <ul className="space-y-2.5">
                  {feat.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2.5 text-[13px] text-secondary"
                    >
                      <Check
                        size={14}
                        className="text-success shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────── Feature Comparison Table ──────────── */

function CellIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
        <Check size={14} className="text-success" strokeWidth={2.5} />
      </div>
    );
  }
  if (value === false) {
    return <Minus size={16} className="text-muted/40" />;
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
      {value}
    </span>
  );
}

function FeatureComparison() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <Star size={12} className="text-primary-500" />
            Comparison
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[620px] mx-auto">
            How SpendWise{" "}
            <span className="text-primary-600">stacks up.</span>
          </h2>
          <p className="mt-4 text-[14px] md:text-[15px] text-secondary leading-relaxed max-w-[520px] mx-auto">
            See how SpendWise compares to manual tracking and other expense
            apps across every feature that matters.
          </p>
        </motion.div>

        {/* Table card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th
                    scope="col"
                    className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted px-6 py-4 w-[40%]"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="relative w-[20%] px-4 py-4 text-center"
                  >
                    <div className="absolute inset-0 bg-primary-500/[0.05]" />
                    <div className="relative flex items-center justify-center gap-1.5">
                      <Star
                        size={13}
                        className="fill-primary-500 text-primary-500"
                      />
                      <span className="text-[14px] font-bold text-primary-600">
                        SpendWise
                      </span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="w-[20%] px-4 py-4 text-center text-[13px] font-semibold text-secondary"
                  >
                    Spreadsheets
                  </th>
                  <th
                    scope="col"
                    className="w-[20%] px-4 py-4 text-center text-[13px] font-semibold text-secondary"
                  >
                    Basic Apps
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={[
                      "group transition-colors duration-150 hover:bg-primary-500/[0.03]",
                      i % 2 === 0 ? "bg-surface-variant/40" : "bg-surface-variant",
                    ].join(" ")}
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 text-left text-[13px] md:text-[14px] font-semibold text-foreground"
                    >
                      {row.feature}
                    </th>
                    <td className="relative px-4 py-4 text-center">
                      <div className="absolute inset-0 bg-primary-500/[0.05]" />
                      <div className="relative flex items-center justify-center">
                        <CellIcon value={row.spendwise} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <CellIcon value={row.spreadsheets} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <CellIcon value={row.otherApps} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border-subtle bg-surface-variant/40 px-4 py-2.5 text-center text-[10px] font-medium text-muted sm:hidden">
            Swipe horizontally to compare →
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────── Feature FAQ ──────────── */

function FeatureFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
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
            Everything you need to know about SpendWise features.{" "}
            <a
              href="mailto:support@spendwise.app"
              className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
            >
              Email us
            </a>{" "}
            if you can&apos;t find your answer.
          </p>
        </motion.div>

        {/* Accordion card */}
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
                    <ChevronDown size={18} className="text-muted" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 py-6 text-[13px] md:text-[14px] text-secondary leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────── Final CTA ──────────── */

function FinalCTA() {
  const trustSignals = [
    "No credit card required",
    "Free forever tier",
    "Export your data anytime",
  ];

  return (
    <section className="py-32 md:py-36 px-5 md:px-10">
      <div className="max-w-[640px] mx-auto text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground mb-6"
        >
          Your finances won&apos;t{" "}
          <span className="text-primary-600">fix themselves.</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-[15px] md:text-[16px] text-secondary leading-relaxed max-w-[460px] mx-auto mb-10"
        >
          Take control of your finances with AI-powered insights.
          Start free today — your future self will thank you.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-col items-center gap-4 mb-8"
        >
          <Link
            href="/download"
            className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-primary-600 text-white text-[16px] font-bold shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[52px]"
          >
            Get Started Free
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
          <Link
            href="/login"
            className="text-[14px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Already have an account? Sign in{" "}
            <ArrowRight size={14} className="inline -translate-y-px" />
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {trustSignals.map((signal, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check size={14} className="text-success" strokeWidth={2.5} />
              <span className="text-[12px] md:text-[13px] font-medium text-muted">
                {signal}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────── Main Page ──────────── */

export function FeaturesClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        {/* Hero */}
        <section className="relative py-20 md:py-26 px-5 md:px-10 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            className="max-w-[720px] mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
              <Sparkles size={12} className="text-primary-500" />
              All Features
            </div>
            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
              Every feature.{" "}
              <span className="text-primary-600">Built for India.</span>
            </h1>
            <p className="text-[16px] text-secondary leading-relaxed max-w-[520px] mx-auto">
              From AI-powered forensic analysis to group expense splitting —
              SpendWise gives you the tools to understand and control every
              rupee.
            </p>
          </motion.div>
        </section>

        <CounterStats />

        <Separator />
        <div className="bg-surface-variant">
          <FeatureDeepDive />
        </div>

        <Separator />
        <FeatureComparison />

        <Separator />
        <div className="bg-surface-variant">
          <FeatureFAQ />
        </div>

        <Separator />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
