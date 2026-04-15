"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Target,
  CheckCircle,
  Clock,
  Zap,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: ShieldCheck,
      text: "Your data is encrypted and private",
      color: "text-green-600",
    },
    {
      icon: Target,
      text: "Set smart limits and save faster",
      color: "text-blue-600",
    },
    {
      icon: Sparkles,
      text: "Gain clarity on every rupee spent",
      color: "text-purple-600",
    },
    {
      icon: Clock,
      text: "Setup in under 60 seconds",
      color: "text-orange-600",
    },
    { icon: Zap, text: "Real-time expense tracking", color: "text-yellow-600" },
    { icon: Lock, text: "Secure OAuth authentication", color: "text-red-600" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden"
      id="main-content"
    >
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-delay:2s]" />
      <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] bg-blue-500/3 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-delay:4s]" />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-semibold no-underline group z-20"
      >
        <motion.div whileHover={{ x: -4 }} className="flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </motion.div>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-6"
          >
            <TrendingUp size={40} color="white" strokeWidth={2.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-foreground mb-3 tracking-tighter"
          >
            Welcome to <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              SpendWise
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-secondary font-medium text-lg"
          >
            Your personal finance journey starts here
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 md:p-10 shadow-2xl shadow-indigo-500/10 relative z-10"
        >
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {benefits.map((benefit, id) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + id * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-variant/50 border border-border-subtle/30 hover:bg-surface-variant transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg bg-surface flex items-center justify-center ${benefit.color}`}
                >
                  <benefit.icon size={16} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold text-secondary leading-tight">
                  {benefit.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Sign In Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-foreground text-background font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
          </div>

          {/* Terms */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-6 text-center text-xs text-muted font-semibold uppercase tracking-widest leading-loose"
          >
            By signing in, you agree to our <br />
            <Link href="#" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
          </motion.p>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
            <CheckCircle size={16} />
            Free forever • No credit card required
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
