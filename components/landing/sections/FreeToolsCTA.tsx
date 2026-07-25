"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, ArrowRight } from "lucide-react";
import { fadeUp } from "./animations";

const tools = [
  {
    icon: Calculator,
    title: "50/30/20 Budget Calculator",
    description:
      "The simplest way to budget. Enter your monthly after-tax income to instantly see how much you should be allocating to needs, wants, and savings.",
    href: "/tools/50-30-20-budget-calculator",
  },
];

// add resources like http://localhost:3000/docs/sage-ai-the-spendwise-chatbot and http://localhost:3000/docs/sage-ai-query-guide

export function FreeToolsCTA() {
  return (
    <section className="py-24 md:py-32 px-5 md:px-10 bg-surface-variant/30">
      <div className="max-w-[1120px] mx-auto">
        {/* ── Headline block ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <h2 className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-5">
            Free Financial Tools
          </h2>
          <p className="text-[15px] text-secondary leading-relaxed max-w-[500px] mx-auto">
            Calculators and resources to help you plan your financial future,{" "}
            <span className="font-semibold text-foreground">
              no account required.
            </span>
          </p>
        </motion.div>

        {/* ── Tool cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={tool.href}
                className="group block h-full rounded-2xl border border-border-subtle bg-surface p-7 transition-all shadow-sm hover:shadow-lg hover:border-primary-500/20 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 mb-5">
                  <tool.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-[13px] text-secondary font-medium leading-relaxed mb-5">
                  {tool.description}
                </p>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-600">
                  Try it now
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
