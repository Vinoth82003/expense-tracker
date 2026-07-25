"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  MessageSquareText,
  PieChart,
  Bell,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { fadeUp } from "./animations";

const features = [
  {
    icon: MessageSquareText,
    title: "Ask anything, naturally",
    description:
      'Type questions like "Where did my money go this week?" and get instant, structured answers — no filters or menus needed.',
  },
  {
    icon: PieChart,
    title: "Deep spending breakdowns",
    description:
      "Sage slices your expenses by category, merchant, time period, and payment method — then surfaces the patterns you missed.",
  },
  {
    icon: Bell,
    title: "Proactive smart alerts",
    description:
      "Get warned before you overspend, not after. Sage learns your rhythm and flags anomalies in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Real data, zero hallucination",
    description:
      "Every number Sage shows comes straight from your tracked transactions. No guessed totals, no fabricated stats — ever.",
  },
];

const chatTurns = [
  {
    role: "user",
    text: "How much did I spend on food this month?",
  },
  {
    role: "ai",
    text: null,
    breakdown: {
      title: "Food & Dining — May 2026",
      rows: [
        { label: "Swiggy", value: "₹4,280" },
        { label: "Zomato", value: "₹2,950" },
        { label: "Groceries (Zepto)", value: "₹3,100" },
        { label: "Office cafeteria", value: "₹1,800" },
      ],
      total: "₹12,130",
      note: "Up 14% from April — Swiggy orders jumped after the 10th.",
    },
  },
  {
    role: "user",
    text: "Any way to bring it down?",
  },
  {
    role: "ai-typing",
  },
];

export function AISection() {
  return (
    <section className="relative py-24 md:py-32 px-5 md:px-10 overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1120px] mx-auto">
        {/* ── Headline block ── */}
        <div className="text-center mb-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6"
          >
            <Sparkles size={12} className="text-primary-500" />
            AI-Powered
          </motion.div>

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[700px] mx-auto mb-5"
          >
            Meet{" "}
            <span className="text-primary-600">
              Sage AI
            </span>{" "}
            — your personal financial analyst.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-[15px] text-secondary leading-relaxed max-w-[500px] mx-auto"
          >
            Ask questions in plain language. Get instant, data-driven answers
            based on your actual transactions — not generic financial advice.
          </motion.p>
        </div>

        {/* ── Mascot ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-col items-center mb-16"
        >
          <div className="relative mb-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles size={40} className="text-white" strokeWidth={1.5} />
            </div>
            {/* Glow ring */}
            <div className="absolute inset-[-8px] rounded-2xl border-2 border-purple-500/25 animate-pulse" />
          </div>
          <span className="text-xl font-bold text-primary-600">
            Sage AI
          </span>
        </motion.div>

        {/* ── Two-column: Features + Chat ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Feature list */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="space-y-7"
          >
            {features.map((feat, i) => (
              <div key={i} className="flex gap-4 mt-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0">
                  <feat.icon size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-[13px] text-secondary leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Right: Chat mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-2xl border border-border-subtle bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-subtle">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Sage AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] text-muted">Online · Ready to help</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 flex flex-col gap-4">
                {chatTurns.map((turn, i) => {
                  if (turn.role === "user") {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary-600 text-white text-[13px] font-medium leading-relaxed">
                          {turn.text}
                        </div>
                      </div>
                    );
                  }

                  if (turn.role === "ai" && turn.breakdown) {
                    const bd = turn.breakdown;
                    return (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={11} className="text-white" />
                        </div>
                        <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-border-subtle bg-surface-variant/60 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2.5">
                            {bd.title}
                          </p>
                          <div className="flex flex-col gap-1.5 mb-3">
                            {bd.rows.map((row, j) => (
                              <div
                                key={j}
                                className="flex justify-between text-[13px]"
                              >
                                <span className="text-secondary">{row.label}</span>
                                <span className="font-semibold text-foreground">
                                  {row.value}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border-subtle text-[13px]">
                            <span className="font-bold text-foreground">Total</span>
                            <span className="font-bold text-primary-600">
                              {bd.total}
                            </span>
                          </div>
                          {bd.note && (
                            <p className="text-[11px] text-muted mt-2.5 leading-relaxed">
                              {bd.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (turn.role === "ai-typing") {
                    return (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={11} className="text-white" />
                        </div>

                        <div className="px-4 py-3 rounded-2xl rounded-tl-md border border-border-subtle bg-surface-variant/60">
                          <div className="flex items-center gap-1.5 h-4">
                            <span
                              className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
