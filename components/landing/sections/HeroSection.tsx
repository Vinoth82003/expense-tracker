"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  BarChart3,
  IndianRupee,
  Target,
  PieChart,
  Activity,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { container, item } from "./animations";

export function HeroSection() {
  return (
    <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* ── Left: Copy ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-6 relative z-10"
        >
          {/* Eyebrow badge */}
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase"
            style={{
              borderColor: "rgba(99,102,241,0.25)",
              background: "rgba(99,102,241,0.06)",
              color: "var(--color-primary-600)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            SpendWise 2.0 is live
          </motion.div>

          {/* Headline — 3 lines, gradient highlights, last word plain */}
          <motion.h1
            variants={item}
            className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground"
          >
            <span
              style={{
                backgroundImage:
                  "linear-gradient(to right, #7c3aed, #8b5cf6, #6366f1)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              Expenses tracked,
            </span>
            <br />
            <span
              style={{
                backgroundImage:
                  "linear-gradient(to right, #6366f1, #7c3aed, #8b5cf6)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              budgets enforced,
            </span>
            <br />
            effortlessly.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={item}
            className="text-[15px] md:text-base text-secondary leading-relaxed max-w-[420px]"
          >
            The AI-powered finance tracker built for India. See every rupee,
            understand the why, and stay on budget — automatically.
          </motion.p>

          {/* CTA — text link with arrow */}
          <motion.div variants={item}>
            <Link
              href="/download"
              id="hero-cta"
              className="inline-flex items-center gap-2 text-base font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Get started free
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={item}
            className="text-[13px] text-muted flex items-center gap-1.5"
          >
            <Zap size={13} className="text-primary-500" />
            4,218 transactions categorized today
          </motion.p>
        </motion.div>

        {/* ── Right: Product Mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative w-full"
        >
          {/* Outer card */}
          <div className="relative rounded-xl md:rounded-2xl border border-border-subtle bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* ── Browser chrome ── */}
            <div className="w-full flex justify-between gap-3 px-4 py-2.5 border-b border-border-subtle bg-surface-variant/40">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="w-full">
                <div className="flex justify-between gap-2 px-3 py-1 rounded-md bg-surface border border-border-subtle text-[11px] text-muted">
                  <span>Search transactions...</span>
                  <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-surface-variant border border-border-subtle text-[10px] font-medium">
                    ⌘ K
                  </kbd>
                </div>
              </div>
              <div className="w-[52px]" />
            </div>

            {/* ── Two-panel app ── */}
            <div className="flex min-h-[320px] md:min-h-[400px]">
              {/* Left sidebar — hidden on mobile */}
              <div className="hidden md:flex flex-col w-[150px] shrink-0 border-r border-border-subtle p-3">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted px-3 mb-2">
                  Overview
                </p>
                {[
                  { icon: BarChart3, label: "Dashboard", active: true },
                  { icon: IndianRupee, label: "Expenses", badge: "3" },
                  { icon: IndianRupee, label: "Income", badge: "1" },
                  { icon: Target, label: "Budgets" },
                  { icon: PieChart, label: "Reports" },
                ].map((navItem, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      navItem.active
                        ? "bg-primary-600 text-white"
                        : "text-secondary hover:bg-surface-variant hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <navItem.icon size={15} />
                      <span>{navItem.label}</span>
                    </div>
                    {navItem.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 text-[9px] font-bold">
                        {navItem.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Main panel */}
              <div className="flex-1 p-4 md:p-5 flex flex-col gap-4 min-w-0">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">Dashboard</p>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-[11px] text-muted">
                      <Activity size={12} />
                      {new Date(Date.now()).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold">
                      + New
                    </div>
                  </div>
                </div>

                {/* 3 stat cards with deltas */}
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {[
                    {
                      label: "Spent",
                      value: "₹17,700",
                      delta: "+12.4%",
                      up: true,
                    },
                    {
                      label: "Income",
                      value: "₹50,000",
                      delta: "+8.2%",
                      up: true,
                    },
                    {
                      label: "Balance",
                      value: "₹32,300",
                      delta: "-3.1%",
                      up: false,
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="p-2.5 md:p-3 rounded-xl bg-surface-variant/60 border border-border-subtle/50"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">
                        {s.label}
                      </p>
                      <p className="text-sm md:text-[15px] font-bold text-foreground mb-0.5">
                        {s.value}
                      </p>
                      <p
                        className={`text-[10px] font-semibold ${
                          s.up ? "text-success" : "text-error"
                        }`}
                      >
                        {s.delta}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI insight card */}
                <div className="p-3 md:p-4 rounded-xl bg-primary-500/[0.06] border border-primary-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <Sparkles size={11} className="text-white" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                        Sage AI
                      </span>
                    </div>
                    <span className="text-muted text-xs">···</span>
                  </div>
                  <p className="text-xs font-medium text-secondary leading-relaxed">
                    Food spending up 18% this week. Swiggy accounts for 62% —
                    consider meal prepping Tuesdays.
                  </p>
                </div>

                {/* Transaction list */}
                <div className="flex flex-col">
                  {[
                    {
                      name: "Swiggy",
                      amount: "−₹420",
                      cat: "Food & Dining",
                      color: "text-foreground",
                    },
                    {
                      name: "Metro Pass",
                      amount: "−₹1,200",
                      cat: "Transport",
                      color: "text-foreground",
                    },
                    {
                      name: "Salary Credit",
                      amount: "+₹1,20,000",
                      cat: "Income",
                      color: "text-success",
                    },
                  ].map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 border-b border-border-subtle/40 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                          <ShoppingCart size={13} className="text-muted" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            {tx.name}
                          </p>
                          <p className="text-[10px] text-muted">{tx.cat}</p>
                        </div>
                      </div>
                      <span className={`text-[13px] font-bold ${tx.color}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
