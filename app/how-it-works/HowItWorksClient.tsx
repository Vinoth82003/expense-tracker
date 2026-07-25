"use client";

import { motion, type Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Target,
  IndianRupee,
  PieChart,
  Activity,
  ShoppingCart,
  CheckCircle2,
  Download,
  Mail,
  Lock,
  Plus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
function Separator() {
  return (
    <div className="flex justify-center bg-surface">
      <div className="h-px w-full max-w-[1120px] bg-border-subtle" />
    </div>
  );
}

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const steps = [
  {
    number: "01",
    chip: "Getting Started",
    title: "Create your free account",
    description:
      "Sign up with Google or email in seconds. No credit card required, no passwords to remember — just instant access to your personal finance dashboard.",
    bullets: [
      "Secure Google OAuth — one tap sign-in",
      "Email + password option available",
      "Bank-grade encryption on all data",
    ],
  },
  {
    number: "02",
    chip: "Daily Use",
    title: "Log expenses as you spend",
    description:
      "Record every transaction the moment it happens. Categorize into Needs and Wants with a single tap — your data stays organized automatically.",
    bullets: [
      "Quick expense entry with ₹ support",
      "Auto-categorize Needs vs Wants",
      "Track income alongside expenses",
    ],
  },
  {
    number: "03",
    chip: "AI Intelligence",
    title: "Get insights, not just numbers",
    description:
      "Sage AI analyzes your spending patterns and surfaces the why behind your money — identifying leaks, overlaps, and opportunities you'd miss on your own.",
    bullets: [
      "Behavioral spending pattern detection",
      "Subscription overlap identification",
      "Personalized savings recommendations",
    ],
  },
  {
    number: "04",
    chip: "Growth",
    title: "Watch your wealth grow",
    description:
      "Visualize progress with real-time dashboards, export Indian financial year reports, and set smart budget limits that alert you before you overspend.",
    bullets: [
      "April–March FY reports with ₹ Lakhs/Crores",
      "Budget alerts at 80% spend threshold",
      "Downloadable CSV & PDF exports",
    ],
  },
];

/* ─────────── Mockup: Auth Screen ─────────── */
function AuthMockup() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-surface-variant/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-4 bg-surface-variant rounded-md max-w-[140px]" />
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <IndianRupee size={18} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-foreground tracking-tight">
            SpendWise
          </span>
        </div>
        <div>
          <h3 className="text-[20px] font-bold text-foreground mb-1">
            Welcome back.
          </h3>
          <p className="text-[13px] text-secondary">
            Sign in to your dashboard.
          </p>
        </div>
        <div className="space-y-3">
          <div className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-foreground text-background rounded-full font-bold text-[13px]">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-surface px-3 text-muted font-medium">or</span>
            </div>
          </div>
          <div className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-surface-variant border border-border-subtle rounded-full font-bold text-[13px] text-foreground">
            <Mail size={14} />
            Continue with email
          </div>
        </div>
        <div className="flex items-center gap-2 text-center justify-center">
          <div className="w-4 h-4 rounded-md border-2 border-primary-600 bg-primary-600 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[11px] text-muted">
            I agree to the Terms & Privacy
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Mockup: Add Expense ─────────── */
function LogMockup() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-surface-variant/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-4 bg-surface-variant rounded-md max-w-[140px]" />
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-500 mb-0.5">
              New Transaction
            </p>
            <p className="text-[17px] font-bold text-foreground">Add Expense</p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
            LIVE
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Amount
          </label>
          <div className="p-4 bg-surface-variant/60 rounded-xl border border-border-subtle text-[28px] font-bold text-foreground tabular-nums">
            ₹ 2,450
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["Needs", "Wants"].map((cat, i) => (
              <div
                key={cat}
                className={`py-3 rounded-xl text-[13px] font-bold border text-center transition-all ${
                  i === 1
                    ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20"
                    : "bg-surface-variant/60 border-border-subtle text-secondary"
                }`}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Note
          </label>
          <div className="p-3 bg-surface-variant/60 rounded-xl border border-border-subtle text-[13px] text-secondary">
            Lunch with team
          </div>
        </div>

        <div className="w-full py-3.5 bg-primary-600 text-white rounded-full font-bold text-[14px] text-center shadow-lg shadow-primary-600/25">
          Confirm Transaction
        </div>
      </div>
    </div>
  );
}

/* ─────────── Mockup: AI Insight ─────────── */
function AIMockup() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-surface-variant/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-4 bg-surface-variant rounded-md max-w-[140px]" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">
              Sage AI
            </p>
            <p className="text-[15px] font-bold text-foreground">
              Weekly Analysis
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-primary-500/[0.06] border border-primary-500/20 space-y-1.5">
          <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
            Spending Alert
          </p>
          <p className="text-[13px] font-medium text-secondary leading-relaxed">
            Food spending up 18% this week. Swiggy accounts for 62% of total
            food spend — consider meal prepping on Tuesdays to save{" "}
            <span className="font-bold text-foreground">~₹1,200/mo</span>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-1.5">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Savings Opportunity
          </p>
          <p className="text-[13px] font-medium text-secondary leading-relaxed">
            Your &quot;Needs&quot; are 12% under budget this month. Move the{" "}
            <span className="font-bold text-foreground">₹5,000 surplus</span>{" "}
            to your emergency fund.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Pattern Accuracy
          </p>
          <p className="text-[13px] font-bold text-primary-600">98.4%</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Mockup: Dashboard Stats ─────────── */
function StatsMockup() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-surface-variant/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-4 bg-surface-variant rounded-md max-w-[140px]" />
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold text-foreground">Dashboard</p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-[11px] text-muted">
            <Activity size={11} />
            July 2026
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Spent", value: "₹17,700", color: "text-foreground" },
            { label: "Income", value: "₹50,000", color: "text-foreground" },
            { label: "Saved", value: "₹32,300", color: "text-success" },
          ].map((s, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-surface-variant/60 border border-border-subtle/50"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">
                {s.label}
              </p>
              <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold text-secondary">
            Spending Trend
          </p>
          <div className="flex items-end gap-1.5 h-16">
            {[40, 65, 45, 80, 55, 70, 48].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-primary-500/20"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted font-medium">
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { name: "Food & Dining", amount: "₹8,200", pct: 34 },
            { name: "Transport", amount: "₹4,100", pct: 17 },
            { name: "Shopping", amount: "₹3,600", pct: 15 },
          ].map((cat, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-foreground truncate">
                    {cat.name}
                  </p>
                  <p className="text-[12px] font-bold text-foreground ml-2">
                    {cat.amount}
                  </p>
                </div>
                <div className="mt-1 h-1 bg-surface-variant rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500/40 rounded-full"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const mockups = [AuthMockup, LogMockup, AIMockup, StatsMockup];

export function HowItWorksClient() {
  return (
    <>
      <Navbar />

      <main className="pt-28 pb-0 overflow-x-hidden">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto text-center space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase"
              style={{
                borderColor: "rgba(99,102,241,0.25)",
                background: "rgba(99,102,241,0.06)",
                color: "var(--color-primary-600)",
              }}
            >
              <Sparkles size={12} className="animate-pulse" />
              How SpendWise works
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[36px] md:text-[48px] lg:text-[56px] font-bold leading-[1.1] tracking-tight text-foreground max-w-3xl mx-auto"
            >
              From sign-up to savings
              <br className="hidden md:block" />{" "}
              <span className="text-primary-600">in four steps.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed"
            >
              No complex setup. No learning curve. Start tracking your money in
              under a minute with the finance tool built for India.
            </motion.p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ STEPS ═══════════ */}
        {steps.map((step, i) => {
          const MockupComponent = mockups[i];
          const isEven = i % 2 === 0;

          return (
            <section key={i}>
              <div
                className={`px-5 md:px-10 py-5 md:py-10 ${
                  isEven ? "bg-surface" : "bg-surface-variant/40"
                }`}
              >
                <div
                  className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                    !isEven ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Text */}
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    className="space-y-6"
                  >
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold tracking-wider uppercase"
                      style={{
                        borderColor: "rgba(99,102,241,0.2)",
                        background: "rgba(99,102,241,0.05)",
                        color: "var(--color-primary-600)",
                      }}
                    >
                      Step {step.number}
                    </div>

                    <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground">
                      {step.title}
                    </h2>

                    <p className="text-[15px] md:text-base text-secondary leading-relaxed max-w-[480px]">
                      {step.description}
                    </p>

                    <ul className="space-y-3">
                      {step.bullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 text-[14px] font-medium text-secondary"
                        >
                          <CheckCircle2
                            size={17}
                            className="text-success shrink-0"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Mockup */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.7,
                      delay: 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative"
                  >
                    <MockupComponent />
                  </motion.div>
                </div>
              </div>
              {i < steps.length - 1 && <Separator />}
            </section>
          );
        })}

        {/* ═══════════ CTA ═══════════ */}
        <Separator />
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-80px" }}
              className="text-center space-y-6"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase"
                style={{
                  borderColor: "rgba(99,102,241,0.25)",
                  background: "rgba(99,102,241,0.06)",
                  color: "var(--color-primary-600)",
                }}
              >
                <Sparkles size={12} />
                Ready to start?
              </div>

              <h2 className="text-[36px] md:text-[48px] font-bold leading-[1.1] tracking-tight text-foreground">
                Take control of your
                <br />
                <span className="text-primary-600">money today.</span>
              </h2>

              <p className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed">
                Join thousands of Indians who stopped guessing and started
                growing. Free forever — no credit card needed.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/download"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary-600 text-white font-bold text-[15px] shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] transition-all"
                >
                  <Download size={16} />
                  Download App
                </Link>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-surface border border-border-subtle font-bold text-[15px] text-secondary hover:text-foreground hover:border-primary-500/20 hover:shadow-lg transition-all"
                >
                  Help Center
                  <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
