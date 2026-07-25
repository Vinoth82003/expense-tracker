"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingCart,
  Gamepad2,
  PiggyBank,
  ArrowRight,
  RotateCcw,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatINRFull(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const needsCategories = [
  "Rent / Home EMI",
  "Groceries & Household",
  "Utilities (Electricity, Water, Internet)",
  "Transportation (Fuel, Metro, Auto)",
  "Insurance Premiums",
  "Loan EMIs (Minimum Payments)",
  "Medical & Healthcare",
  "Children's Education",
];

const wantsCategories = [
  "Dining Out & Food Delivery",
  "Entertainment (Movies, OTT, Events)",
  "Shopping (Clothes, Gadgets)",
  "Travel & Vacations",
  "Hobbies & Subscriptions",
  "Gym / Sports Memberships",
  "Gifts & Celebrations",
];

const savingsCategories = [
  "Emergency Fund",
  "Fixed Deposits / RD",
  "Mutual Fund SIPs",
  "Stock Investments",
  "PPF / NPS",
  "Extra Debt Repayment",
  "Goal-Based Savings",
];

const fadeUp = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function CalculatorClient() {
  const [income, setIncome] = useState<string>("");
  const [needsPct, setNeedsPct] = useState(50);
  const [wantsPct, setWantsPct] = useState(30);
  const [savingsPct, setSavingsPct] = useState(20);
  const [showAnnual, setShowAnnual] = useState(false);
  const [showNeeds, setShowNeeds] = useState(false);
  const [showWants, setShowWants] = useState(false);
  const [showSavings, setShowSavings] = useState(false);

  const totalPct = needsPct + wantsPct + savingsPct;

  const monthlyIncome = useMemo(() => {
    const parsed = parseFloat(income.replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }, [income]);

  const needs = useMemo(() => (monthlyIncome * needsPct) / 100, [monthlyIncome, needsPct]);
  const wants = useMemo(() => (monthlyIncome * wantsPct) / 100, [monthlyIncome, wantsPct]);
  const savings = useMemo(() => (monthlyIncome * savingsPct) / 100, [monthlyIncome, savingsPct]);
  const annualIncome = monthlyIncome * 12;

  const adjustPct = (field: "needs" | "wants" | "savings", delta: number) => {
    const setter = field === "needs" ? setNeedsPct : field === "wants" ? setWantsPct : setSavingsPct;
    setter((prev) => Math.max(0, Math.min(100, prev + delta)));
  };

  const reset = () => {
    setIncome("");
    setNeedsPct(50);
    setWantsPct(30);
    setSavingsPct(20);
  };

  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-5 md:px-10">

          {/* Hero */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/5 text-primary-600 text-[10px] font-black tracking-widest uppercase border border-primary-500/10 mb-6">
              Free Tool
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight mb-6">
              50/30/20 <span className="text-primary-600">Budget Calculator</span>
            </h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
              The simplest way to manage your money. Enter your monthly income and instantly see how much to allocate to Needs, Wants, and Savings — in Indian Rupees.
            </p>
          </motion.section>

          {/* Calculator */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <div className="bg-surface border border-border-subtle rounded-[2rem] p-8 md:p-10 shadow-sm">

              {/* Income Input */}
              <div className="mb-10">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3">
                  Monthly After-Tax Income
                </label>
                <div className="relative">
                  <IndianRupee size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full pl-12 pr-4 py-4 bg-surface-variant/50 border border-border-subtle rounded-2xl text-2xl font-black text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
                  />
                </div>
                {monthlyIncome > 0 && (
                  <p className="mt-2 text-sm text-muted font-medium">
                    {formatINRFull(monthlyIncome)} / month = {formatINRFull(annualIncome)} / year
                  </p>
                )}
              </div>

              {/* Percentage Sliders */}
              <div className="space-y-6 mb-10">
                {[
                  { label: "Needs", pct: needsPct, setPct: setNeedsPct, color: "blue", icon: ShoppingCart, desc: "Rent, groceries, bills" },
                  { label: "Wants", pct: wantsPct, setPct: setWantsPct, color: "violet", icon: Gamepad2, desc: "Entertainment, dining, shopping" },
                  { label: "Savings", pct: savingsPct, setPct: setSavingsPct, color: "emerald", icon: PiggyBank, desc: "Emergency fund, investments" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <item.icon size={16} className={`text-${item.color}-500`} />
                        <span className="text-sm font-black text-foreground">{item.label}</span>
                        <span className="text-xs text-muted font-medium">— {item.desc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const setter = item.label === "Needs" ? setNeedsPct : item.label === "Wants" ? setWantsPct : setSavingsPct;
                            setter((p) => Math.max(0, p - 5));
                          }}
                          className="w-7 h-7 rounded-lg bg-surface-variant border border-border-subtle flex items-center justify-center text-muted hover:text-foreground transition-colors text-sm font-black"
                        >
                          −
                        </button>
                        <span className="text-lg font-black text-foreground w-12 text-center">{item.pct}%</span>
                        <button
                          onClick={() => {
                            const setter = item.label === "Needs" ? setNeedsPct : item.label === "Wants" ? setWantsPct : setSavingsPct;
                            setter((p) => Math.min(100, p + 5));
                          }}
                          className="w-7 h-7 rounded-lg bg-surface-variant border border-border-subtle flex items-center justify-center text-muted hover:text-foreground transition-colors text-sm font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={item.pct}
                      onChange={(e) => {
                        const setter = item.label === "Needs" ? setNeedsPct : item.label === "Wants" ? setWantsPct : setSavingsPct;
                        setter(Number(e.target.value));
                      }}
                      className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-${item.color}-500/20 accent-${item.color}-500`}
                      style={{
                        background: `linear-gradient(to right, var(--color-${item.color}-500, #6366f1) ${item.pct}%, transparent ${item.pct}%)`,
                      }}
                    />
                  </div>
                ))}

                {/* Total % indicator */}
                <div className={`flex items-center justify-between p-3 rounded-xl ${totalPct === 100 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                  <div className="flex items-center gap-2">
                    <Info size={14} className={totalPct === 100 ? "text-emerald-600" : "text-amber-600"} />
                    <span className={`text-xs font-bold ${totalPct === 100 ? "text-emerald-700" : "text-amber-700"}`}>
                      Total: {totalPct}%{totalPct !== 100 ? ` (${totalPct > 100 ? "Over" : "Under"} by ${Math.abs(totalPct - 100)}%)` : " — Perfect split"}
                    </span>
                  </div>
                  <button onClick={reset} className="text-xs font-bold text-muted hover:text-foreground transition-colors flex items-center gap-1">
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>

              {/* Results */}
              {monthlyIncome > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Needs (50%)", amount: needs, pct: needsPct, color: "blue", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600" },
                    { label: "Wants (30%)", amount: wants, pct: wantsPct, color: "violet", bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-600" },
                    { label: "Savings (20%)", amount: savings, pct: savingsPct, color: "emerald", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600" },
                  ].map((item) => (
                    <div key={item.label} className={`p-6 rounded-2xl ${item.bg} border ${item.border} text-center`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${item.text} mb-2`}>{item.label}</p>
                      <p className="text-3xl font-black text-foreground mb-1">{formatINR(item.amount)}</p>
                      <p className="text-xs text-muted font-medium">per month</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Annual View Toggle */}
              {monthlyIncome > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowAnnual(!showAnnual)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-variant border border-border-subtle rounded-xl text-sm font-bold text-secondary hover:text-foreground transition-all"
                  >
                    <Calendar size={14} />
                    {showAnnual ? "Hide" : "Show"} Annual Breakdown (FY 2025-26)
                    {showAnnual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              )}

              {/* Annual Breakdown */}
              {showAnnual && monthlyIncome > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-6 p-6 bg-surface-variant/30 border border-border-subtle rounded-2xl"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">April 2025 — March 2026</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-500/5 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 mb-1">Needs (Annual)</p>
                      <p className="text-xl font-black text-foreground">{formatINR(needs * 12)}</p>
                    </div>
                    <div className="text-center p-4 bg-violet-500/5 rounded-xl">
                      <p className="text-xs font-bold text-violet-600 mb-1">Wants (Annual)</p>
                      <p className="text-xl font-black text-foreground">{formatINR(wants * 12)}</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-500/5 rounded-xl">
                      <p className="text-xs font-bold text-emerald-600 mb-1">Savings (Annual)</p>
                      <p className="text-xl font-black text-foreground">{formatINR(savings * 12)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* Category Breakdown */}
          {monthlyIncome > 0 && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-16"
            >
              <h2 className="text-2xl font-black text-foreground mb-8 text-center">
                Where Should Each Rupee Go?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Needs */}
                <div className="bg-surface border border-border-subtle rounded-[1.5rem] p-6">
                  <button
                    onClick={() => setShowNeeds(!showNeeds)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <ShoppingCart size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-foreground text-sm">Needs</p>
                        <p className="text-xs text-muted font-medium">{formatINR(needs)}/mo</p>
                      </div>
                    </div>
                    {showNeeds ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </button>
                  {showNeeds && (
                    <ul className="mt-4 space-y-2">
                      {needsCategories.map((cat) => (
                        <li key={cat} className="text-xs text-secondary font-medium flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                          {cat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Wants */}
                <div className="bg-surface border border-border-subtle rounded-[1.5rem] p-6">
                  <button
                    onClick={() => setShowWants(!showWants)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                        <Gamepad2 size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-foreground text-sm">Wants</p>
                        <p className="text-xs text-muted font-medium">{formatINR(wants)}/mo</p>
                      </div>
                    </div>
                    {showWants ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </button>
                  {showWants && (
                    <ul className="mt-4 space-y-2">
                      {wantsCategories.map((cat) => (
                        <li key={cat} className="text-xs text-secondary font-medium flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                          {cat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Savings */}
                <div className="bg-surface border border-border-subtle rounded-[1.5rem] p-6">
                  <button
                    onClick={() => setShowSavings(!showSavings)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <PiggyBank size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-foreground text-sm">Savings</p>
                        <p className="text-xs text-muted font-medium">{formatINR(savings)}/mo</p>
                      </div>
                    </div>
                    {showSavings ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </button>
                  {showSavings && (
                    <ul className="mt-4 space-y-2">
                      {savingsCategories.map((cat) => (
                        <li key={cat} className="text-xs text-secondary font-medium flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                          {cat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* What is 50/30/20 Explainer */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-16"
          >
            <div className="bg-surface border border-border-subtle rounded-[2rem] p-8 md:p-10">
              <h2 className="text-2xl font-black text-foreground mb-6">
                What is the 50/30/20 Budget Rule?
              </h2>
              <div className="prose prose-sm max-w-none text-secondary font-medium leading-relaxed space-y-4">
                <p>
                  The 50/30/20 rule is a simple budgeting framework popularized by Elizabeth Warren. It divides your <strong className="text-foreground">after-tax income</strong> into three categories:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <p className="font-black text-blue-600 mb-1">50% — Needs</p>
                    <p className="text-xs text-secondary">Essential expenses you can&apos;t avoid: rent, groceries, utilities, transportation, insurance.</p>
                  </div>
                  <div className="p-4 bg-violet-500/5 rounded-xl border border-violet-500/10">
                    <p className="font-black text-violet-600 mb-1">30% — Wants</p>
                    <p className="text-xs text-secondary">Lifestyle choices: dining out, entertainment, shopping, hobbies, subscriptions.</p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <p className="font-black text-emerald-600 mb-1">20% — Savings</p>
                    <p className="text-xs text-secondary">Future security: emergency fund, SIPs, FDs, debt repayment, investments.</p>
                  </div>
                </div>
                <p>
                  It&apos;s not a rigid rule — it&apos;s a starting point. If you live in an expensive city like Mumbai, you might adjust to 60/20/20. The key is <strong className="text-foreground">consistently saving at least 20%</strong> of your income.
                </p>
                <p>
                  This calculator helps you visualize the split in Indian Rupees with <strong className="text-foreground">Lakhs/Crores formatting</strong> and <strong className="text-foreground">Indian financial year (April–March) planning</strong>.
                </p>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <h2 className="text-3xl font-black text-foreground mb-4">
              Track Your Budget with AI
            </h2>
            <p className="text-secondary font-medium mb-8 max-w-lg mx-auto">
              SpendWise automatically splits your expenses into Needs and Wants, tracks your 50/30/20 budget, and alerts you when you overspend.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-primary-500/25"
            >
              Start Tracking Free <ArrowRight size={18} />
            </Link>
          </motion.section>

        </div>
      </main>

      <Footer />
    </>
  );
}
