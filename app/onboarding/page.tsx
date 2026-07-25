"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Target,
  Zap,
  ArrowRight,
  IndianRupee,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Check,
} from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [expenseMode, setExpenseMode] = useState<"limit" | "no-limit">("limit");
  const [monthlyLimit, setMonthlyLimit] = useState<string>("10000");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user && (session.user as any).onboarded) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseMode,
          monthlyLimit: expenseMode === "limit" ? parseFloat(monthlyLimit) : null,
        }),
      });

      if (res.ok) {
        await update();
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Onboarding failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-2xl text-center mb-12">
          <div className="w-20 h-20 bg-surface-variant rounded-2xl mx-auto mb-6 animate-pulse" />
          <div className="h-10 w-3/4 max-w-md bg-surface-variant rounded-xl mx-auto mb-4 animate-pulse" />
          <div className="h-4 w-1/2 bg-surface-variant rounded-md mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <div className="p-8 rounded-2xl border border-border-subtle bg-surface h-56 animate-pulse" />
          <div className="p-8 rounded-2xl border border-border-subtle bg-surface h-56 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">

      {/* ═══════════════════ LEFT — FORM ═══════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background relative">
        <div className="w-full max-w-[440px]">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-bold text-foreground tracking-tight">
              SpendWise
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-5">
              <Sparkles size={12} className="text-primary-500" />
              Quick Setup
            </div>
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[1.15] tracking-tight text-foreground mb-2">
              Personalize your{" "}
              <span className="text-primary-600">experience.</span>
            </h1>
            <p className="text-[15px] text-secondary font-medium">
              How would you like to track your finances with SpendWise?
            </p>
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => setExpenseMode("limit")}
              className={`cursor-pointer p-6 rounded-2xl border transition-all relative ${
                expenseMode === "limit"
                  ? "bg-surface border-primary-500 shadow-sm"
                  : "bg-surface border-border-subtle hover:border-primary-500/30"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  expenseMode === "limit"
                    ? "bg-primary-500/10 text-primary-600"
                    : "bg-surface-variant text-secondary"
                }`}
              >
                <Target size={20} strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-bold text-foreground mb-1">
                Monthly Limit
              </h3>
              <p className="text-[13px] text-secondary font-medium leading-relaxed">
                Set a budget and track how much you have left each month.
              </p>
              {expenseMode === "limit" && (
                <motion.div
                  layoutId="check"
                  className="absolute top-4 right-4"
                >
                  <CheckCircle2 size={20} className="text-primary-500" />
                </motion.div>
              )}
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => setExpenseMode("no-limit")}
              className={`cursor-pointer p-6 rounded-2xl border transition-all relative ${
                expenseMode === "no-limit"
                  ? "bg-surface border-primary-500 shadow-sm"
                  : "bg-surface border-border-subtle hover:border-primary-500/30"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  expenseMode === "no-limit"
                    ? "bg-primary-500/10 text-primary-600"
                    : "bg-surface-variant text-secondary"
                }`}
              >
                <Zap size={20} strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-bold text-foreground mb-1">
                No Limit
              </h3>
              <p className="text-[13px] text-secondary font-medium leading-relaxed">
                Keep it simple — just track expenses without a budget.
              </p>
              {expenseMode === "no-limit" && (
                <motion.div
                  layoutId="check"
                  className="absolute top-4 right-4"
                >
                  <CheckCircle2 size={20} className="text-primary-500" />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Budget input */}
          <AnimatePresence mode="wait">
            {expenseMode === "limit" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <label className="block text-[12px] font-semibold text-secondary mb-3">
                  Monthly Budget Amount
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-secondary group-focus-within:text-primary-500 transition-colors">
                    <IndianRupee size={18} />
                  </div>
                  <input
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full bg-surface border border-border-subtle rounded-2xl py-4  pl-13 pr-6 pl-6 text-[20px] font-bold text-foreground focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-muted/40 p-10"
                    placeholder="10,000"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="space-y-4">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-full bg-primary-600 text-white font-bold text-[15px] shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Get Started
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-center gap-2 text-muted text-[13px] font-medium">
              <ShieldCheck size={14} />
              You can change these settings anytime
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT — VISUAL ═══════════════════ */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-surface-variant relative overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[400px] px-10">
          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
                  <Sparkles size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">
                    AI Forensic Analysis
                  </h3>
                  <p className="text-[13px] text-secondary font-medium leading-relaxed">
                    Get a deep breakdown of your spending patterns, anomalies,
                    and actionable suggestions — powered by Google Gemini.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <Target size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">
                    Smart Budget Alerts
                  </h3>
                  <p className="text-[13px] text-secondary font-medium leading-relaxed">
                    Get email alerts when you cross 80% of your monthly budget
                    — before you overshoot, not after.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <TrendingUp size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">
                    50/30/20 Rule Analysis
                  </h3>
                  <p className="text-[13px] text-secondary font-medium leading-relaxed">
                    See how your actual spending compares to the recommended
                    Needs/Wants/Savings split with a radar chart.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {["10,000+ users", "Bank-grade security", "Free forever"].map(
              (signal, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={13} className="text-success" strokeWidth={2.5} />
                  <span className="text-[12px] font-medium text-muted">
                    {signal}
                  </span>
                </div>
              )
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
