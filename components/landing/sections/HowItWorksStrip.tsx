"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, ReceiptText, Sparkles, ArrowRight } from "lucide-react";
import { fadeUp } from "./animations";

const steps = [
  {
    icon: UserPlus,
    title: "Create your free account",
    description:
      "Sign up with Google or email — no credit card, no setup wizard.",
  },
  {
    icon: ReceiptText,
    title: "Log expenses as you spend",
    description:
      "Add spending in seconds by chat or form, in rupees, with the categories that matter to you.",
  },
  {
    icon: Sparkles,
    title: "Get insights, not just numbers",
    description:
      "Sage AI explains where your money went, flags budget risks, and reports on the Indian financial year.",
  },
];

export function HowItWorksStrip() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1120px] mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <ArrowRight size={12} className="text-primary-500" />
            How It Works
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-5">
            Start tracking{" "}
            <span className="text-primary-600">in minutes.</span>
          </h2>
          <p className="text-[15px] text-secondary leading-relaxed max-w-[500px] mx-auto">
            The full walkthrough covers sign-up, logging, AI analysis, and
            Indian FY reporting — end to end.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600">
                  <step.icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-[13px] text-secondary font-medium leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="text-center"
        >
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            See the full 4-step guide
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
