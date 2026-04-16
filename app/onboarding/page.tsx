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
  Sparkles
} from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [expenseMode, setExpenseMode] = useState<"limit" | "no-limit">("limit");
  const [monthlyLimit, setMonthlyLimit] = useState<string>("10000");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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
        await update(); // Refresh session
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background animate-pulse">
        <div className="w-full max-w-2xl text-center mb-12">
          <div className="w-20 h-20 bg-surface-variant rounded-3xl mx-auto mb-6"></div>
          <div className="h-10 w-3/4 max-w-md bg-surface-variant rounded-xl mx-auto mb-4"></div>
          <div className="h-4 w-1/2 bg-surface-variant rounded-md mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 w-full max-w-2xl">
          <div className="p-8 rounded-[2.5rem] border-2 border-border-subtle bg-surface/50 h-56 flex flex-col justify-center">
             <div className="w-14 h-14 bg-surface-variant rounded-2xl mb-6"></div>
             <div className="h-6 w-32 bg-surface-variant rounded-lg mb-4"></div>
             <div className="h-4 w-full bg-surface-variant rounded-md mb-2"></div>
             <div className="h-4 w-4/5 bg-surface-variant rounded-md"></div>
          </div>
          <div className="p-8 rounded-[2.5rem] border-2 border-border-subtle bg-surface/50 h-56 flex flex-col justify-center">
             <div className="w-14 h-14 bg-surface-variant rounded-2xl mb-6"></div>
             <div className="h-6 w-32 bg-surface-variant rounded-lg mb-4"></div>
             <div className="h-4 w-full bg-surface-variant rounded-md mb-2"></div>
             <div className="h-4 w-4/5 bg-surface-variant rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6"
          >
            <Sparkles size={40} color="white" />
          </motion.div>
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">
            Personalize Your Experience
          </h1>
          <p className="text-secondary font-medium">
            How would you like to track your finances with SpendWise?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Limit Mode Option */}
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setExpenseMode("limit")}
            className={`cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${
              expenseMode === "limit" 
                ? "bg-surface border-primary-500 shadow-2xl shadow-primary-500/10" 
                : "bg-surface/50 border-border-subtle hover:border-border-hover"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
              expenseMode === "limit" ? "bg-primary-500 text-white" : "bg-surface-variant text-secondary"
            }`}>
              <Target size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Monthly Limit</h3>
            <p className="text-secondary text-sm leading-relaxed mb-4">
              Set a budget and track how much you have left to spend each month.
            </p>
            {expenseMode === "limit" && (
              <motion.div layoutId="check" className="absolute top-6 right-6 text-primary-500">
                <CheckCircle2 size={24} />
              </motion.div>
            )}
          </motion.div>

          {/* No Limit Mode Option */}
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setExpenseMode("no-limit")}
            className={`cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${
              expenseMode === "no-limit" 
                ? "bg-surface border-primary-500 shadow-2xl shadow-primary-500/10" 
                : "bg-surface/50 border-border-subtle hover:border-border-hover"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
              expenseMode === "no-limit" ? "bg-primary-500 text-white" : "bg-surface-variant text-secondary"
            }`}>
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Limit</h3>
            <p className="text-secondary text-sm leading-relaxed mb-4">
              Keep it simple. Just track your expenses without a predefined budget.
            </p>
            {expenseMode === "no-limit" && (
              <motion.div layoutId="check" className="absolute top-6 right-6 text-primary-500">
                <CheckCircle2 size={24} />
              </motion.div>
            )}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {expenseMode === "limit" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 w-full max-w-sm mx-auto"
            >
              <label className="block text-sm font-bold text-secondary uppercase tracking-widest mb-4 text-center">
                Set Your Monthly Budget
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-secondary group-focus-within:text-primary-500 transition-colors">
                  <IndianRupee size={24} />
                </div>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full bg-surface border-2 border-border-subtle rounded-3xl py-6 pl-16 pr-8 text-2xl font-black text-foreground focus:border-primary-500 focus:outline-none transition-all shadow-sm"
                  placeholder="0.00"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-foreground text-background font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-background/50 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                Let's Get Started
                <ArrowRight size={24} />
              </>
            )}
          </motion.button>
          
          <div className="flex items-center gap-2 text-muted text-sm font-semibold">
            <ShieldCheck size={16} />
            You can change these settings anytime later
          </div>
        </div>
      </motion.div>
    </div>
  );
}
