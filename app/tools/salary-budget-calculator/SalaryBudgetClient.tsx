"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wallet, PiggyBank, CalendarDays, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SiteBreadcrumbs } from "@/components/seo/SiteBreadcrumbs";
import { salaryBudget } from "@/lib/calculators";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatINR(value: number): string {
  return inr.format(Math.round(value));
}

function parseAmount(raw: string): number {
  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

export function SalaryBudgetClient() {
  const [net, setNet] = useState("");
  const [commitments, setCommitments] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [days, setDays] = useState("30");

  const result = useMemo(
    () =>
      salaryBudget({
        monthlyNet: parseAmount(net),
        fixedCommitments: parseAmount(commitments),
        savingsGoal: parseAmount(savingsGoal),
        daysInMonth: parseInt(days, 10),
      }),
    [net, commitments, savingsGoal, days]
  );

  const hasInput = parseAmount(net) > 0;

  const inputField = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    hint: string
  ) => (
    <div>
      <label htmlFor={id} className="block text-[14px] font-bold text-foreground mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-[16px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
      />
      <p className="mt-1.5 text-[12px] text-muted">{hint}</p>
    </div>
  );

  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">
        {/* ═══════════ HERO + CALCULATOR ═══════════ */}
        <section className="bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto text-center space-y-5">
            <div className="flex justify-center">
              <SiteBreadcrumbs
                items={[
                  { label: "Tools", href: "/tools" },
                  { label: "Salary Budget Calculator" },
                ]}
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary">
              <Wallet size={12} className="text-primary-500" />
              Free Tool
            </div>

            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[620px] mx-auto">
              Salary Budget{" "}
              <span className="text-primary-600">Calculator.</span>
            </h1>
            <p className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed">
              Enter your monthly take-home pay, fixed commitments, and savings
              goal. Get a daily spending allowance you can actually follow.
            </p>
          </div>

          <div className="max-w-[860px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-3xl border border-border-subtle bg-surface p-6 md:p-8 text-left shadow-sm">
            <div className="space-y-5">
              {inputField(
                "monthly-net",
                "Monthly take-home (net) salary",
                net,
                setNet,
                "In-hand salary after tax and deductions."
              )}
              {inputField(
                "fixed-commitments",
                "Fixed monthly commitments",
                commitments,
                setCommitments,
                "Rent, EMIs, bills, insurance premiums."
              )}
              {inputField(
                "savings-goal",
                "Monthly savings goal",
                savingsGoal,
                setSavingsGoal,
                "Amount you move to savings or investments first."
              )}
              <div>
                <label
                  htmlFor="days-in-month"
                  className="block text-[14px] font-bold text-foreground mb-1.5"
                >
                  Days in month
                </label>
                <select
                  id="days-in-month"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-[16px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                >
                  <option value="28">28 (non-leap February)</option>
                  <option value="29">29 (leap February)</option>
                  <option value="30">30</option>
                  <option value="31">31</option>
                </select>
              </div>
            </div>

            <div className="space-y-4" aria-live="polite">
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-muted mb-1">
                  Daily spending allowance
                </p>
                <p className="text-[32px] font-bold text-primary-600">
                  {formatINR(result.dailyAllowance)}
                </p>
                <p className="text-[13px] text-secondary">
                  per day for {days} days
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays size={14} className="text-violet-500" />
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                      Daily pool
                    </p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground">
                    {formatINR(result.dailyPool)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <PiggyBank size={14} className="text-emerald-500" />
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                      Savings rate
                    </p>
                  </div>
                  <p className="text-[20px] font-bold text-foreground">
                    {result.savingsRatePct}%
                  </p>
                </div>
              </div>

              {hasInput && (
                <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm space-y-1.5">
                  <p className="text-[13px] text-secondary">
                    Allocated (commitments + savings):{" "}
                    <strong className="text-foreground">
                      {formatINR(result.allocated)}
                    </strong>{" "}
                    · {result.allocatedPct}% of take-home
                  </p>
                  {result.overAllocated && (
                    <p className="flex items-start gap-2 text-[13px] font-semibold text-amber-600">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      Commitments and savings goal exceed your take-home pay.
                      Reduce one of them to get a positive daily allowance.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════ METHODOLOGY & LIMITATIONS ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[800px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h2 className="text-[20px] font-bold text-foreground">
                How this calculator works
              </h2>
              <p className="text-[14px] text-secondary leading-relaxed">
                Daily pool ={" "}
                <strong className="text-foreground">
                  take-home − commitments − savings goal
                </strong>{" "}
                (floored at zero). The daily allowance divides that pool by the
                number of days you select. Savings rate = savings goal ÷
                take-home. Every result rounds to whole rupees and is computed
                deterministically from your inputs.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="text-[20px] font-bold text-foreground">
                Limitations
              </h2>
              <p className="text-[14px] text-secondary leading-relaxed">
                This is a planning tool, not financial advice. It assumes your
                commitments and income are fixed for the month — it does not
                model variable income, bonus cycles, taxes, or unplanned
                expenses. Use your actual in-hand salary. Inputs and results
                stay in your browser and are not stored. For the full
                month-by-month routine around these numbers, follow the{" "}
                <Link
                  href="/docs/monthly-budgeting-guide"
                  className="text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-2"
                >
                  monthly budgeting guide
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[800px] mx-auto space-y-8">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Frequently asked{" "}
              <span className="text-primary-600">questions.</span>
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  How do I budget my monthly salary?
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed">
                  Start with your take-home pay. Set aside your savings goal
                  first, subtract fixed commitments (rent, EMIs, bills), and
                  divide what remains by the days in the month. That gives you a
                  safe daily spending amount.
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  What counts as a fixed commitment?
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed">
                  Recurring amounts you must pay each month: rent, loan EMIs,
                  utility bills, insurance premiums, and school fees. One-off
                  spending like gifts or travel belongs in your daily pool, not
                  here.
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  How much of my salary should I save?
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed">
                  There is no single right answer. A common starting point is
                  the 50/30/20 rule (20% to savings), adjusted for your city,
                  income, and goals. The calculator shows your current savings
                  rate so you can see where you stand.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CTA ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-5">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Track every rupee{" "}
              <span className="text-primary-600">automatically.</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[460px] mx-auto">
              SpendWise records expenses, shows where your salary went, and
              keeps your daily budget on track.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-primary-600 text-white text-[16px] font-bold shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[52px]"
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
