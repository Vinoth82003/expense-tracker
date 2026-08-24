"use client";

import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  TrendingUp,
  ArrowLeft,
  Mail,
  Lock,
  Loader2,
  ChevronRight,
  BarChart3,
  Target,
  IndianRupee,
  Sparkles,
  ShoppingCart,
  PieChart,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginClient({ bridgeTo }: { bridgeTo?: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();

  const canSubmit = termsAccepted && !isLoading;

  // Cross-origin sign-in: after auth completes on this (primary) origin,
  // hop through /bridge so the origin that started sign-in gets a session.
  const callbackUrl = bridgeTo
    ? `/bridge?to=${encodeURIComponent(bridgeTo)}`
    : "/onboarding";

  const handleGoogleSignIn = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError("");

    try {
      let res: any;
      try {
        res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
      } catch (signInErr: any) {
        if (signInErr?.name === "TypeError" && /Invalid URL/i.test(signInErr?.message)) {
          res = null;
        } else {
          throw signInErr;
        }
      }

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (session?.user) {
          if (bridgeTo) {
            router.push(callbackUrl);
            return;
          }
          const redirectTo = (session.user as any).redirectTo || "onboarding";
          router.push("/" + redirectTo);
        } else {
          setError("Invalid email or password");
          setIsLoading(false);
        }
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">

      {/* ═══════════════════ LEFT — VISUAL ═══════════════════ */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-surface-variant relative overflow-hidden">
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

        <div className="relative z-10 w-full px-10">
          {/* Dashboard mockup — same as hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl md:rounded-2xl border border-border-subtle bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden"
          >
            {/* Browser chrome */}
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

            {/* Two-panel app */}
            <div className="flex min-h-[360px]">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-[140px] shrink-0 border-r border-border-subtle p-3">
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
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold">
                      + New
                    </div>
                  </div>
                </div>

                {/* 3 stat cards */}
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {[
                    { label: "Spent", value: "₹17,700", delta: "+12.4%", up: true },
                    { label: "Income", value: "₹50,000", delta: "+8.2%", up: true },
                    { label: "Balance", value: "₹32,300", delta: "-3.1%", up: false },
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
                          <p className="text-[13px] font-semibold text-foreground">{tx.name}</p>
                          <p className="text-[10px] text-muted">{tx.cat}</p>
                        </div>
                      </div>
                      <span className={`text-[13px] font-bold ${tx.color}`}>{tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT — FORM ═══════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background relative">
        <Link
          href="/"
          className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-muted hover:text-foreground transition-colors text-[13px] font-semibold z-10"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-bold text-foreground tracking-tight">
              SpendWise
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[1.15] tracking-tight text-foreground mb-2">
              Sign in to{" "}
              <span className="text-primary-600">your dashboard.</span>
            </h1>
            <p className="text-[15px] text-secondary font-medium">
              See where every rupee went — all in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
            <AnimatePresence mode="wait">
              {!showEmailForm ? (
                <motion.div
                  key="social"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-8 space-y-6"
                >
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-surface border border-border-subtle rounded-full font-semibold text-[14px] text-foreground shadow-sm group transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-variant"
                  >
                    <svg
                      className="w-5 h-5 group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-subtle" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                      <span className="bg-surface px-3 text-muted font-medium">
                        or
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowEmailForm(true)}
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-surface-variant border border-border-subtle rounded-full font-semibold text-[14px] text-foreground hover:border-primary-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Mail size={16} />
                    Continue with email
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                  className="p-8"
                >
                  <button
                    onClick={() => {
                      setShowEmailForm(false);
                      setError("");
                    }}
                    className="flex items-center gap-2 text-[13px] font-semibold text-muted hover:text-foreground transition-colors mb-6"
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>

                  <form onSubmit={handleEmailSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <label
                        className="text-[12px] font-semibold text-secondary"
                        htmlFor="email"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-variant border border-border-subtle focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold text-[14px] placeholder:text-muted/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-[12px] font-semibold text-secondary"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-variant border border-border-subtle focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold text-[14px] placeholder:text-muted/50"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[13px] font-semibold text-error bg-error/10 p-3 rounded-2xl border border-error/20"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full py-3.5 bg-primary-600 text-white rounded-full font-bold text-[15px] shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Terms checkbox */}
          <div className="mt-6 flex items-start gap-3">
            <button
              type="button"
              onClick={() => setTermsAccepted(!termsAccepted)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                termsAccepted
                  ? "bg-primary-600 border-primary-600"
                  : "border-muted/40 bg-transparent hover:border-muted/60"
              }`}
            >
              {termsAccepted && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <p className="text-[12px] text-muted leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-foreground hover:text-primary-600 font-semibold transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-foreground hover:text-primary-600 font-semibold transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {!termsAccepted && (
            <p className="text-center text-[11px] text-muted font-medium mt-6">
              Accept the terms above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
