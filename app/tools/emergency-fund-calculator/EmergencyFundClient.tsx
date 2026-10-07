"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Target, CalendarClock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SiteBreadcrumbs } from "@/components/seo/SiteBreadcrumbs";
import { emergencyFund } from "@/lib/calculators";

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

const COVER_OPTIONS = ["3", "6", "9", "12"];
const BUILD_OPTIONS = ["6", "12", "18", "24"];

export function EmergencyFundClient() {
  const [expenses, setExpenses] = useState("");
  const [coverMonths, setCoverMonths] = useState("6");
  const [buildMonths, setBuildMonths] = useState("12");

  const result = useMemo(
    () =>
      emergencyFund({
        monthlyEssentialExpenses: parseAmount(expenses),
        monthsOfCover: parseInt(coverMonths, 10),
        monthsToBuild: parseInt(buildMonths, 10),
      }),
    [expenses, coverMonths, buildMonths]
  );

  const hasInput = parseAmount(expenses) > 0;

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
                  { label: "Emergency Fund Calculator" },
                ]}
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary">
              <Shield size={12} className="text-primary-500" />
              Free Tool
            </div>

            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[620px] mx-auto">
              Emergency Fund{" "}
              <span className="text-primary-600">Calculator.</span>
            </h1>
            <p className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed">
              Work out how much safety-net corpus you need and the monthly
              saving required to reach it — in Indian Rupees (₹).
            </p>
          </div>

          <div className="max-w-[860px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-3xl border border-border-subtle bg-surface p-6 md:p-8 text-left shadow-sm">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="essential-expenses"
                  className="block text-[14px] font-bold text-foreground mb-1.5"
                >
                  Monthly essential expenses
                </label>
                <input
                  id="essential-expenses"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-[16px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                />
                <p className="mt-1.5 text-[12px] text-muted">
                  Rent, food, utilities, transport, EMIs — the must-pays.
                </p>
              </div>

              <fieldset>
                <legend className="block text-[14px] font-bold text-foreground mb-1.5">
                  Months of cover
                </legend>
                <div className="grid grid-cols-4 gap-2" role="radiogroup">
                  {COVER_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={coverMonths === m}
                      onClick={() => setCoverMonths(m)}
                      className={`rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                        coverMonths === m
                          ? "border-primary-500 bg-primary-500/10 text-primary-600"
                          : "border-border-subtle bg-surface text-secondary hover:border-primary-500/30"
                      }`}
                    >
                      {m} mo
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="block text-[14px] font-bold text-foreground mb-1.5">
                  Build the fund within
                </legend>
                <div className="grid grid-cols-4 gap-2" role="radiogroup">
                  {BUILD_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={buildMonths === m}
                      onClick={() => setBuildMonths(m)}
                      className={`rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                        buildMonths === m
                          ? "border-primary-500 bg-primary-500/10 text-primary-600"
                          : "border-border-subtle bg-surface text-secondary hover:border-primary-500/30"
                      }`}
                    >
                      {m} mo
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="space-y-4" aria-live="polite">
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-primary-500" />
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                    Target corpus
                  </p>
                </div>
                <p className="text-[32px] font-bold text-primary-600">
                  {formatINR(result.targetCorpus)}
                </p>
                <p className="text-[13px] text-secondary">
                  {coverMonths} months of cover ({result.coverYears}{" "}
                  {result.coverYears === 1 ? "year" : "years"})
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock size={14} className="text-emerald-500" />
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                    Save each month
                  </p>
                </div>
                <p className="text-[32px] font-bold text-emerald-600">
                  {formatINR(result.monthlySavingNeeded)}
                </p>
                <p className="text-[13px] text-secondary">
                  to reach the target in {buildMonths} months
                </p>
              </div>

              {hasInput && (
                <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
                  <p className="text-[13px] text-secondary leading-relaxed">
                    Keep this fund separate from your day-to-day spending — a
                    liquid fund or savings account works well for money you may
                    need at short notice.
                  </p>
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
                Target corpus ={" "}
                <strong className="text-foreground">
                  monthly essential expenses × months of cover
                </strong>
                . Monthly saving needed = target corpus ÷ months to build. Both
                results round to whole rupees and are computed only from the
                numbers you enter.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="text-[20px] font-bold text-foreground">
                Limitations
              </h2>
              <p className="text-[14px] text-secondary leading-relaxed">
                This is a planning tool, not financial advice. It assumes your
                essential expenses stay constant and that you save a fixed
                amount every month — it does not model inflation, investment
                returns, or income changes. The right cover (3–12 months)
                depends on your job stability and dependants. Inputs stay in
                your browser and are not stored. The{" "}
                <Link
                  href="/docs/monthly-budgeting-guide"
                  className="text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-2"
                >
                  savings-first budgeting routine
                </Link>{" "}
                shows how to fund this monthly saving without breaking the
                rest of the month.
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
                  How big should my emergency fund be?
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed">
                  A common guideline is 3 to 6 months of essential expenses.
                  If your income is variable or you support a family, 6 to 12
                  months offers more cushion. Pick the cover that matches your
                  situation in the calculator.
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  Where should I keep my emergency fund?
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed">
                  Somewhere you can withdraw from quickly without losing value:
                  a high-interest savings account or a liquid fund. Avoid
                  locking it in fixed deposits with penalties for early
                  withdrawal.
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  Should I save for an emergency fund or invest first?
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed">
                  Build a small emergency buffer first (even 1 month of
                  expenses), then invest while you continue building the fund.
                  The safety net comes first because it keeps you from
                  borrowing at high interest when something unexpected happens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CTA ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-5">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Save towards your{" "}
              <span className="text-primary-600">safety net.</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[460px] mx-auto">
              SpendWise tracks your expenses and savings goals so you can see
              how close you are to your emergency corpus every month.
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
