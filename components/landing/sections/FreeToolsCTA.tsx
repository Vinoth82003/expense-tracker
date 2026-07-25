"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, ArrowRight, BookOpen, FileText } from "lucide-react";
import { fadeUp } from "./animations";

const tools = [
  {
    icon: Calculator,
    title: "50/30/20 Budget Calculator",
    description:
      "The simplest way to budget. Enter your monthly after-tax income to instantly see how much you should be allocating to needs, wants, and savings.",
    href: "/tools/50-30-20-budget-calculator",
    type: "tool" as const,
  },
];

const resources = [
  {
    icon: BookOpen,
    title: "Sage AI — The SpendWise Chatbot",
    description:
      "Learn how SpendWise's built-in AI assistant reads your transactions and answers financial questions in plain language.",
    href: "/docs/sage-ai-the-spendwise-chatbot",
    type: "resource" as const,
  },
  {
    icon: FileText,
    title: "Sage AI Query Guide",
    description:
      "A practical reference for the questions you can ask Sage AI — from monthly summaries to category breakdowns and budget alerts.",
    href: "/docs/sage-ai-query-guide",
    type: "resource" as const,
  },
];

const items = [...tools, ...resources];


export function FreeToolsCTA() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1120px] mx-auto">
        {/* ── Headline block ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <Calculator size={12} className="text-primary-500" />
            Tools &amp; Resources
          </div>
          <h2 className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-5">
            Tools &amp;{" "}
            <span className="text-primary-600">Resources.</span>
          </h2>
          <p className="text-[15px] text-secondary leading-relaxed max-w-[500px] mx-auto">
            Calculators and resources to help you plan your financial future,{" "}
            <span className="font-semibold text-foreground">
              no account required.
            </span>
          </p>
        </motion.div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={item.href}
                className="group block h-full rounded-2xl border border-border-subtle bg-surface p-7 transition-all shadow-sm hover:shadow-lg hover:border-primary-500/20 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600">
                    <item.icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-primary-600 bg-primary-500/10 border border-primary-500/20 rounded-full px-2.5 py-0.5">
                    {item.type === "tool" ? "Tool" : "Guide"}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-secondary font-medium leading-relaxed mb-5">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-600">
                  {item.type === "tool" ? "Try it now" : "Read more"}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
