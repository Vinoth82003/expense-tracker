"use client";

import { motion, Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  IndianRupee,
  Target,
  PieChart,
  Smartphone,
  ArrowRight,
  Brain,
  Zap,
  Lock,
  Download,
  ShieldCheck,
  FileText,
  Tag,
  Activity,
  CheckCircle,
  Star,
  Quote,
  User as UserIcon,
  Wallet,
  BarChart3,
  Sparkles,
  ShoppingCart,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useRef, lazy, Suspense } from "react";

const TestimonialsSection = lazy(() => import("./TestimonialsSection"));

/* ──────────────────────────────────────────────
   DATA
 ────────────────────────────────────────────── */

const features = [
  {
    icon: Brain,
    title: "Forensic AI Analysis",
    description:
      "Let AI dig deep into your spending. Detect hidden leaks, spot anomalies, and get personalized saving strategies — automatically.",
  },
  {
    icon: IndianRupee,
    title: "Rupee-Ready Intelligence",
    description:
      "Built for India. ₹ formatting, UPI tracking, Lakhs/Crores support, and financial-year reporting from April to March.",
  },
  {
    icon: Target,
    title: "Dynamic Budgeting",
    description:
      "Set smart monthly budgets that adapt to your lifestyle. Get real-time alerts before you overspend — not after.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    description:
      "Google OAuth 2.0 authentication, encryption in transit and at rest, and zero password storage. Your data stays yours.",
  },
  {
    icon: FileText,
    title: "PDF Report Export",
    description:
      "Generate professional tax-ready financial reports in one click. Perfect for tax season or personal reviews.",
  },
  {
    icon: Smartphone,
    title: "PWA — Install Anywhere",
    description:
      "No app store needed. Install SpendWise directly to your home screen for a native-app experience that works offline.",
  },
];

const bentoFeatures = [
  {
    icon: Tag,
    title: "Smart Tagging System",
    description:
      "Categorize every expense with custom labels — Needs, Wants, Investments — and drill down into subcategories for laser-focused clarity.",
    wide: true,
  },
  {
    icon: Zap,
    title: "Instant Insights",
    description:
      "Get a full forensic overview of your monthly finances in under 2 seconds with our AI engine.",
    wide: false,
    accent: true,
  },
];

const trustedBy = ["Fintech", "Students", "Freelancers", "Businesses", "Investors"];

/* ──────────────────────────────────────────────
   ANIMATION VARIANTS
 ────────────────────────────────────────────── */

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function useCountUp(end: number, duration = 1800, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * end);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { ref, value: decimals > 0 ? value.toFixed(decimals) : Math.round(value) };
}

// TestimonialsSection is now lazy-loaded from its own file

/* ──────────────────────────────────────────────
   COUNTER STATS
 ────────────────────────────────────────────── */

const counterItems = [
  { icon: Users, value: 10, suffix: "+", label: "Active Users", decimals: 0 },
  { icon: IndianRupee, value: 50, suffix: "M+", label: "Expenses Tracked", decimals: 0 },
  { icon: ShieldCheck, value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
  { icon: Star, value: 4.9, suffix: "/5", label: "User Rating", decimals: 1 },
];

const CounterStat = ({ icon: Icon, value, suffix, label, decimals }: {
  icon: any;
  value: number;
  suffix: string;
  label: string;
  decimals: number;
}) => {
  const { ref, value: count } = useCountUp(value, 1800, decimals);
  return (
    <div ref={ref} className="flex flex-col items-center text-center gap-2 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0">
        <Icon size={18} />
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
        {count}{suffix}
      </div>
      <div className="text-xs text-muted font-medium">{label}</div>
    </div>
  );
};

const CounterStats = () => (
  <section className="border-y border-border-subtle bg-surface py-12 md:py-16 px-5 md:px-10">
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {counterItems.map((item) => (
        <CounterStat key={item.label} {...item} />
      ))}
    </div>
  </section>
);

/* ──────────────────────────────────────────────
   COMPONENT
 ────────────────────────────────────────────── */

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">

        {/* ━━━━ HERO SECTION ━━━━ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10  px-5 md:px-10 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[45%_1fr] gap-12 lg:gap-20 items-center">
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

              {/* Headline — 3 lines, last word muted */}
              <motion.h1
                variants={item}
                className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground"
              >
                Expenses tracked,
                <br />
                budgets enforced,
                <br />
                <span className="text-muted">effortlessly.</span>
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
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full"
            >
              {/* Outer card */}
              <div className="relative rounded-xl md:rounded-2xl border border-border-subtle bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* ── Browser chrome ── */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle bg-surface-variant/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-surface border border-border-subtle text-[11px] text-muted">
                      <span>Search transactions...</span>
                      <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-surface-variant border border-border-subtle text-[10px] font-medium">
                        ⌘K
                      </kbd>
                    </div>
                  </div>
                  <div className="w-[52px]" />
                </div>

                {/* ── Two-panel app ── */}
                <div className="flex min-h-[320px] md:min-h-[400px]">
                  {/* Left sidebar — hidden on mobile */}
                  <div className="hidden md:flex flex-col w-[200px] shrink-0 border-r border-border-subtle p-3">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted px-3 mb-2">
                      Overview
                    </p>
                    {[
                      { icon: BarChart3, label: "Dashboard", active: true },
                      { icon: IndianRupee, label: "Expenses", badge: "3 New" },
                      { icon: IndianRupee, label: "Income", badge: "1 New" },
                      { icon: Target, label: "Budgets" },
                      { icon: PieChart, label: "Reports" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          item.active
                            ? "bg-primary-600 text-white"
                            : "text-secondary hover:bg-surface-variant hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon size={15} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 text-[9px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Main panel */}
                  <div className="flex-1 p-4 md:p-5 flex flex-col gap-4 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">
                        Dashboard
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-[11px] text-muted">
                          <Activity size={12} />
                          May 2026
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold">
                          + New
                        </div>
                      </div>
                    </div>

                    {/* 3 stat cards with deltas */}
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {[
                        { label: "Spent", value: "₹42,500", delta: "+12.4%", up: true },
                        { label: "Income", value: "₹1,20,000", delta: "+8.2%", up: true },
                        { label: "Balance", value: "₹77,500", delta: "-3.1%", up: false },
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
                        Food spending up 18% this week. Swiggy accounts for 62%
                        — consider meal prepping Tuesdays.
                      </p>
                    </div>

                    {/* Transaction list */}
                    <div className="flex flex-col">
                      {[
                        { name: "Swiggy", amount: "−₹420", cat: "Food & Dining", color: "text-foreground" },
                        { name: "Metro Pass", amount: "−₹1,200", cat: "Transport", color: "text-foreground" },
                        { name: "Salary Credit", amount: "+₹1,20,000", cat: "Income", color: "text-success" },
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

        {/* ━━━━ COUNTER STATS STRIP ━━━━ */}
        <CounterStats />

        {/* ━━━━ TRUSTED BY STRIP ━━━━ */}
        {/* <section className="py-10 border-y border-border-subtle/50">
          <div className="max-w-5xl mx-auto px-5 md:px-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
              Trusted by 10,000+ users tracking their finances
            </span>
            <div className="flex items-center gap-8 flex-wrap justify-center">
              {trustedBy.map((brand) => (
                <span
                  key={brand}
                  className="text-[13px] font-black uppercase tracking-widest text-muted/60 hover:text-muted transition-colors"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section> */}

        {/* ━━━━ PROBLEM SECTION ━━━━ */}
        <section className="py-24 md:py-32 px-5 md:px-10">
          <div className="max-w-[1080px] mx-auto">
            {/* Headline block */}
            <div className="text-center mb-16">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6"
              >
                <Zap size={12} className="text-primary-500" />
                The Problem
              </motion.div>

              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="text-2xl md:text-5xl font-bold leading-[1.15] tracking-tight text-foreground max-w-[700px] mx-auto mb-5"
              >
                Managing money{" "}
                <span className="text-primary-600">shouldn&apos;t feel like a second job.</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="text-[15px] text-secondary leading-relaxed max-w-[550px] mx-auto"
              >
                Most Indians know they should track spending — but existing tools
                are too manual, too generic, or give insights only after the damage
                is done.
              </motion.p>
            </div>

            {/* 3-card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: Clock,
                  stat: "4+ hrs/week",
                  title: "Manual tracking burns hours",
                  description:
                    "Sorting through UPI SMS alerts, entering transactions by hand, and reconciling across PhonePe, GPay, and bank apps eats into time you could spend actually living.",
                  iconBg: "bg-amber-500/10",
                  iconColor: "text-amber-600",
                },
                {
                  icon: AlertTriangle,
                  stat: "67%",
                  title: "Overspend without realizing",
                  description:
                    "Without real-time alerts, most people discover they blew their budget when the credit card bill arrives — by then it is already too late to course-correct.",
                  iconBg: "bg-red-500/10",
                  iconColor: "text-red-500",
                },
                {
                  icon: Brain,
                  stat: "78%",
                  title: "Financial anxiety is constant",
                  description:
                    "Not knowing where your money went creates a low-grade stress that follows you everywhere — from small daily guilt to dread at the end of every month.",
                  iconBg: "bg-violet-500/10",
                  iconColor: "text-violet-600",
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group p-3 md:p-6 rounded-2xl border border-border-subtle bg-surface hover:shadow-lg hover:border-primary-500/20 transition-all"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${card.iconBg}`}
                  >
                    <card.icon size={20} className={card.iconColor} />
                  </div>
                  <p className="text-[22px] md:text-[24px] font-bold text-foreground mb-1 tracking-tight">
                    {card.stat}
                  </p>
                  <h3 className="text-[15px] font-bold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[13px] text-secondary leading-relaxed">
                    {card.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ FEATURES GRID ━━━━ */}
        <section className="py-28 px-5 md:px-10">
          <div className="max-w-7xl mx-auto">

            {/* Section header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-6"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.07)",
                  color: "#6366f1",
                }}
              >
                <Activity size={12} /> Engineered for Transparency
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                Every Rupee. Every Reason.
              </h2>
              <p className="text-lg text-secondary font-medium max-w-xl mx-auto">
                Our toolkit gives you the microscopic detail you need to master your cash flow.
              </p>
            </motion.div>

            {/* 3×2 feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  className="group p-6 rounded-2xl border border-border-subtle bg-surface hover:border-primary-500/25 transition-all shadow-sm hover:shadow-lg"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      borderColor: "rgba(99,102,241,0.2)",
                      color: "#6366f1",
                    }}
                  >
                    <feat.icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-black text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-secondary font-medium leading-relaxed">{feat.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Link to full features */}
            <div className="mt-12 text-center">
              <Link
                href="/features"
                aria-label="Explore all capabilities of SpendWise"
                className="inline-flex items-center gap-2 text-base font-black hover:gap-4 transition-all text-indigo-600 dark:text-indigo-400"
              >
                Explore all capabilities <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ━━━━ BENTO FEATURE HIGHLIGHTS ━━━━ */}
        <section className="py-20 px-5 md:px-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">

            {/* Wide card — Tagging */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="relative rounded-3xl overflow-hidden border border-border-subtle min-h-[340px] flex flex-col p-8 group"
              style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
              }}
            >
              {/* Visual mockup inside bento */}
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(99,102,241,0.25) 0%, transparent 70%)"
                }}
              />

              {/* Mock chart area */}
              <div className="flex-1 flex items-center justify-center mb-6 relative z-10">
                <div className="w-full max-w-xs">
                  <div className="flex items-end gap-3 h-28 px-4">
                    {[55, 80, 45, 95, 65, 75, 50, 85, 60, 90].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="flex-1 rounded-t-md"
                        style={{
                          background: i % 3 === 0
                            ? "rgba(99,102,241,0.6)"
                            : i % 3 === 1
                            ? "rgba(99,102,241,0.3)"
                            : "rgba(99,102,241,0.15)",
                        }}
                      />
                    ))}
                  </div>
                  {/* Fake labels */}
                  <div className="flex justify-between px-4 mt-2">
                    {["Needs", "Wants", "Invest"].map((l) => (
                      <span key={l} className="text-[9px] font-black text-muted uppercase tracking-widest">{l}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    borderColor: "rgba(99,102,241,0.2)",
                    color: "#6366f1",
                  }}
                >
                  <Tag size={20} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">
                  Granular Tagging Systems
                </h3>
                <p className="text-sm text-secondary font-medium leading-relaxed max-w-md">
                  Categorize every expense with custom forensic labels and multi-level tagging hierarchies.
                </p>
              </div>
            </motion.div>

            {/* Narrow accent card — Instant Insights */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.15 }}
              className="relative rounded-3xl overflow-hidden border min-h-[340px] flex flex-col p-8"
              style={{
                background: "linear-gradient(145deg, #6366f1 0%, #4f46e5 100%)",
                borderColor: "rgba(99,102,241,0.4)",
              }}
            >
              <div className="flex-1 flex items-center justify-center">
                {/* Animated pulse icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.15)" }}
                  >
                    <Zap size={36} className="text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-40" />
                  <div className="absolute inset-[-12px] rounded-full border border-white/15 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-white/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">AI Powered</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-3">
                  Instant Insight Generation
                </h3>
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  Get a forensic overview of your monthly health in under 2 seconds with our optimised edge engine.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━ TESTIMONIALS ━━━━ */}
        <section className="py-20 px-5 md:px-10 bg-surface-variant/30 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-warning/30 bg-warning/5 text-warning text-[11px] font-black tracking-widest uppercase mb-6">
                <Star size={12} className="fill-warning" /> Loved by the Community
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                What Our Users Say
              </h2>
            </motion.div>

            <Suspense fallback={
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            }>
              <TestimonialsSection />
            </Suspense>
          </div>
        </section>

        {/* ━━━━ FINAL CTA ━━━━ */}
        <section className="py-28 px-5 md:px-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="relative rounded-3xl overflow-hidden border border-border-subtle text-center p-12 md:p-20"
              style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 blur-[100px] pointer-events-none -z-10"
                style={{ background: "rgba(99,102,241,0.1)" }}
              />

              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-8"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.07)",
                  color: "#6366f1",
                }}
              >
                <Zap size={12} /> Zero Cost, Maximum Clarity
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[0.95]">
                Your Wallet,{" "}
                <span className="italic text-indigo-600 dark:text-indigo-400">
                  Redefined.
                </span>
              </h2>

              <p className="text-lg text-secondary font-medium max-w-xl mx-auto mb-10">
                Join 10,000+ Indians taking full control of their financial destiny.
                Free forever. No credit card. No surprises.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  id="cta-start-free"
                  aria-label="Start free today with SpendWise"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base transition-all hover:-translate-y-1 active:scale-95 shadow-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Start Free Today
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/download"
                  id="cta-install-app"
                  aria-label="Install SpendWise progressive web app"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base border border-border-subtle text-secondary hover:text-foreground hover:border-indigo-600/40 dark:hover:border-indigo-400/40 transition-all"
                >
                  <Download size={18} />
                  Install App
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-muted text-[11px] font-black uppercase tracking-widest">
                <Lock size={12} />
                Bank-grade security · No credit card required
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />

      <style jsx global>{`
        .tracking-tight {
          letter-spacing: -0.04em;
        }
      `}</style>
    </>
  );
}
