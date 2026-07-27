"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { fadeUp } from "./animations";

const trustSignals = [
  "No credit card required",
  "Free forever tier",
  "Export your data anytime",
];

export function FinalCTA() {
  return (
    <section className="py-32 md:py-36 px-5 md:px-10">
      <div className="max-w-[640px] mx-auto text-center">
        {/* ── Headline ── */}
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

        {/* ── Subheadline ── */}
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

        {/* ── CTA row ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-col items-center gap-4 mb-8"
        >
          <Link
            href="/download"
            id="cta-final"
            aria-label="Get started free with SpendWise"
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

        {/* ── Trust row ── */}
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
