"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
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
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
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

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

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

  const reset = () => {
    setIncome("");
    setNeedsPct(50);
    setWantsPct(30);
    setSavingsPct(20);
  };

  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto text-center space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary"
            >
              <IndianRupee size={12} className="text-primary-500" />
              Free Tool
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6"
            >
              50/30/20 Budget{" "}
              <span className="text-primary-600">Calculator.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed"
            >
              The simplest way to manage your money. Enter your monthly income
              and instantly see how much to allocate to Needs, Wants, and
              Savings — in Indian Rupees.
            </motion.p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ CALCULATOR ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[800px] mx-auto">
            <div className="rounded-2xl border border-border-subtle bg-surface shadow-sm p-8 md:p-10 space-y-10">
              {/* Income Input */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
                  Monthly After-Tax Income
                </label>
                <div className="relative">
                  <IndianRupee
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full pl-11 pr-4 py-4 bg-surface-variant/50 border border-border-subtle rounded-2xl text-[24px] font-bold text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
                  />
                </div>
                {monthlyIncome > 0 && (
                  <p className="mt-2 text-[13px] text-muted font-medium">
                    {formatINRFull(monthlyIncome)} / month ={" "}
                    {formatINRFull(annualIncome)} / year
                  </p>
                )}
              </div>

              {/* Percentage Sliders */}
              <div className="space-y-6">
                {[
                  {
                    label: "Needs",
                    pct: needsPct,
                    setPct: setNeedsPct,
                    color: "blue",
                    icon: ShoppingCart,
                    desc: "Rent, groceries, bills",
                  },
                  {
                    label: "Wants",
                    pct: wantsPct,
                    setPct: setWantsPct,
                    color: "violet",
                    icon: Gamepad2,
                    desc: "Entertainment, dining, shopping",
                  },
                  {
                    label: "Savings",
                    pct: savingsPct,
                    setPct: setSavingsPct,
                    color: "emerald",
                    icon: PiggyBank,
                    desc: "Emergency fund, investments",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <item.icon
                          size={14}
                          className={`text-${item.color}-500`}
                        />
                        <span className="text-[14px] font-bold text-foreground">
                          {item.label}
                        </span>
                        <span className="text-[12px] text-muted font-medium">
                          — {item.desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const setter =
                              item.label === "Needs"
                                ? setNeedsPct
                                : item.label === "Wants"
                                  ? setWantsPct
                                  : setSavingsPct;
                            setter((p) => Math.max(0, p - 5));
                          }}
                          className="w-7 h-7 rounded-lg bg-surface-variant border border-border-subtle flex items-center justify-center text-muted hover:text-foreground transition-colors text-[13px] font-bold"
                        >
                          −
                        </button>
                        <span className="text-[16px] font-bold text-foreground w-12 text-center">
                          {item.pct}%
                        </span>
                        <button
                          onClick={() => {
                            const setter =
                              item.label === "Needs"
                                ? setNeedsPct
                                : item.label === "Wants"
                                  ? setWantsPct
                                  : setSavingsPct;
                            setter((p) => Math.min(100, p + 5));
                          }}
                          className="w-7 h-7 rounded-lg bg-surface-variant border border-border-subtle flex items-center justify-center text-muted hover:text-foreground transition-colors text-[13px] font-bold"
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
                        const setter =
                          item.label === "Needs"
                            ? setNeedsPct
                            : item.label === "Wants"
                              ? setWantsPct
                              : setSavingsPct;
                        setter(Number(e.target.value));
                      }}
                      className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-${item.color}-500/20 accent-${item.color}-500`}
                      style={{
                        background: `linear-gradient(to right, var(--color-${item.color}-500, #6366f1) ${item.pct}%, transparent ${item.pct}%)`,
                      }}
                    />
                  </div>
                ))}

                {/* Total indicator */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl ${totalPct === 100 ? "bg-success/10 border border-success/20" : "bg-warning/10 border border-warning/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <Info
                      size={14}
                      className={
                        totalPct === 100 ? "text-success" : "text-warning"
                      }
                    />
                    <span
                      className={`text-[12px] font-bold ${totalPct === 100 ? "text-success" : "text-warning"}`}
                    >
                      Total: {totalPct}%
                      {totalPct !== 100
                        ? ` (${totalPct > 100 ? "Over" : "Under"} by ${Math.abs(totalPct - 100)}%)`
                        : " — Perfect split"}
                    </span>
                  </div>
                  <button
                    onClick={reset}
                    className="text-[12px] font-bold text-muted hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>

              {/* Results */}
              {monthlyIncome > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Needs",
                      amount: needs,
                      pct: needsPct,
                      bg: "bg-blue-500/10",
                      border: "border-blue-500/20",
                      text: "text-blue-600",
                    },
                    {
                      label: "Wants",
                      amount: wants,
                      pct: wantsPct,
                      bg: "bg-violet-500/10",
                      border: "border-violet-500/20",
                      text: "text-violet-600",
                    },
                    {
                      label: "Savings",
                      amount: savings,
                      pct: savingsPct,
                      bg: "bg-emerald-500/10",
                      border: "border-emerald-500/20",
                      text: "text-emerald-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`p-5 rounded-2xl ${item.bg} border ${item.border} text-center`}
                    >
                      <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${item.text} mb-1`}
                      >
                        {item.label} ({item.pct}%)
                      </p>
                      <p className="text-[24px] font-bold text-foreground mb-0.5">
                        {formatINR(item.amount)}
                      </p>
                      <p className="text-[12px] text-muted font-medium">
                        per month
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Annual toggle */}
              {monthlyIncome > 0 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAnnual(!showAnnual)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-variant border border-border-subtle rounded-xl text-[13px] font-bold text-secondary hover:text-foreground transition-all"
                  >
                    <Calendar size={14} />
                    {showAnnual ? "Hide" : "Show"} Annual Breakdown (FY 2025-26)
                    {showAnnual ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
              )}

              {/* Annual Breakdown */}
              {showAnnual && monthlyIncome > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="p-6 bg-surface-variant/30 border border-border-subtle rounded-2xl"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-4">
                    April 2025 — March 2026
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-500/5 rounded-xl">
                      <p className="text-[12px] font-bold text-blue-600 mb-1">
                        Needs (Annual)
                      </p>
                      <p className="text-[20px] font-bold text-foreground">
                        {formatINR(needs * 12)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-violet-500/5 rounded-xl">
                      <p className="text-[12px] font-bold text-violet-600 mb-1">
                        Wants (Annual)
                      </p>
                      <p className="text-[20px] font-bold text-foreground">
                        {formatINR(wants * 12)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-emerald-500/5 rounded-xl">
                      <p className="text-[12px] font-bold text-emerald-600 mb-1">
                        Savings (Annual)
                      </p>
                      <p className="text-[20px] font-bold text-foreground">
                        {formatINR(savings * 12)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════════ CATEGORY BREAKDOWN ═══════════ */}
        {monthlyIncome > 0 && (
          <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
            <div className="max-w-[1120px] mx-auto">
              <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground mb-8 text-center">
                Where Should Each{" "}
                <span className="text-primary-600">Rupee Go?</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Needs",
                    amount: needs,
                    cats: needsCategories,
                    color: "blue",
                    icon: ShoppingCart,
                    show: showNeeds,
                    setShow: setShowNeeds,
                  },
                  {
                    label: "Wants",
                    amount: wants,
                    cats: wantsCategories,
                    color: "violet",
                    icon: Gamepad2,
                    show: showWants,
                    setShow: setShowWants,
                  },
                  {
                    label: "Savings",
                    amount: savings,
                    cats: savingsCategories,
                    color: "emerald",
                    icon: PiggyBank,
                    show: showSavings,
                    setShow: setShowSavings,
                  },
                ].map((col) => (
                  <div
                    key={col.label}
                    className="rounded-2xl border border-border-subtle bg-surface shadow-sm p-6"
                  >
                    <button
                      onClick={() => col.setShow(!col.show)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-${col.color}-500/10 flex items-center justify-center text-${col.color}-500`}
                        >
                          <col.icon size={18} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-foreground text-[14px]">
                            {col.label}
                          </p>
                          <p className="text-[12px] text-muted font-medium">
                            {formatINR(col.amount)}/mo
                          </p>
                        </div>
                      </div>
                      {col.show ? (
                        <ChevronUp size={16} className="text-muted" />
                      ) : (
                        <ChevronDown size={16} className="text-muted" />
                      )}
                    </button>
                    {col.show && (
                      <ul className="mt-4 space-y-2">
                        {col.cats.map((cat) => (
                          <li
                            key={cat}
                            className="text-[13px] text-secondary font-medium flex items-center gap-2"
                          >
                            <span
                              className={`w-1 h-1 rounded-full bg-${col.color}-400 shrink-0`}
                            />
                            {cat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {monthlyIncome > 0 && <Separator />}

        {/* ═══════════ EXPLAINER ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[800px] mx-auto space-y-6">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              What is the 50/30/20{" "}
              <span className="text-primary-600">Budget Rule?</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed">
              The 50/30/20 rule is a simple budgeting framework popularized by
              Elizabeth Warren. It divides your{" "}
              <strong className="text-foreground">after-tax income</strong> into
              three categories:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-500/[0.06] border border-blue-500/20">
                <p className="text-[14px] font-bold text-blue-600 mb-1">
                  50% — Needs
                </p>
                <p className="text-[13px] text-secondary">
                  Essential expenses you can&apos;t avoid: rent, groceries,
                  utilities, transportation, insurance.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-violet-500/[0.06] border border-violet-500/20">
                <p className="text-[14px] font-bold text-violet-600 mb-1">
                  30% — Wants
                </p>
                <p className="text-[13px] text-secondary">
                  Lifestyle choices: dining out, entertainment, shopping,
                  hobbies, subscriptions.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20">
                <p className="text-[14px] font-bold text-emerald-600 mb-1">
                  20% — Savings
                </p>
                <p className="text-[13px] text-secondary">
                  Future security: emergency fund, SIPs, FDs, debt repayment,
                  investments.
                </p>
              </div>
            </div>
            <p className="text-[15px] text-secondary leading-relaxed">
              It&apos;s not a rigid rule — it&apos;s a starting point. If you
              live in an expensive city like Mumbai, you might adjust to
              60/20/20. The key is{" "}
              <strong className="text-foreground">
                consistently saving at least 20%
              </strong>{" "}
              of your income.
            </p>
            <p className="text-[15px] text-secondary leading-relaxed">
              This calculator helps you visualize the split in Indian Rupees
              with{" "}
              <strong className="text-foreground">
                Lakhs/Crores formatting
              </strong>{" "}
              and{" "}
              <strong className="text-foreground">
                Indian financial year (April–March) planning
              </strong>
              .
            </p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ CTA ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-5">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Track Your Budget{" "}
              <span className="text-primary-600">with AI.</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[460px] mx-auto">
              SpendWise automatically splits your expenses into Needs and Wants,
              tracks your 50/30/20 budget, and alerts you when you overspend.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-primary-600 text-white text-[16px] font-bold shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[52px]"
            >
              Start Tracking Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
