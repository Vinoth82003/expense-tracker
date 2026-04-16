"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
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
      title: "Bank-grade Security",
      desc: "Your data is encrypted and completely private.",
    },
    {
      icon: Target,
      title: "Smart Goals",
      desc: "Set limits, monitor trends, and save faster.",
    },
    {
      icon: Sparkles,
      title: "Clarity on Spending",
      desc: "Gain deep insights on every rupee you spend.",
    },
    {
      icon: Zap,
      title: "Real-time Tracking",
      desc: "Instant synchronization across all your devices.",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* 
        ========================================
        LEFT PANEL - BRANDING & BENEFITS
        ========================================
      */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 flex-col justify-between p-12 overflow-hidden text-white border-r border-white/10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[140px] pointer-events-none animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium mb-16 group"
          >
            <motion.div whileHover={{ x: -4 }} className="flex items-center gap-2">
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </motion.div>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-2xl mb-8">
              <TrendingUp size={32} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl font-black mb-6 leading-tight tracking-tighter">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Spending Journey
              </span>
            </h1>
            <p className="text-lg text-white/70 font-medium max-w-md leading-relaxed">
              Join 10,000+ Indians taking control of their personal finances with an effortless, intelligent tracker.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col gap-6 mt-12">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="mt-1 w-10 h-10 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-indigo-300">
                <benefit.icon size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1 tracking-wide">{benefit.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 
        ========================================
        RIGHT PANEL - LOGIN CARD
        ========================================
      */}
      <div className="w-full lg:w-1/2 flex flex-col relative items-center justify-center p-6 sm:p-12">
        {/* Mobile-only back button */}
        <Link
          href="/"
          className="absolute top-8 left-8 flex lg:hidden items-center gap-2 text-secondary hover:text-foreground transition-colors font-medium z-20"
        >
          <motion.div whileHover={{ x: -4 }} className="flex items-center gap-2 text-sm">
            <ArrowLeft size={18} />
            <span>Home</span>
          </motion.div>
        </Link>
        
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo on mobile only */}
          <div className="flex lg:hidden justify-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <TrendingUp size={32} color="white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-secondary font-medium">
              Sign in to continue to SpendWise
            </p>
          </div>

          <motion.div 
            className="p-8 sm:p-10 rounded-[2rem] bg-surface/80 backdrop-blur-2xl border border-border-subtle shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
          >
            {/* Soft inner glow */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem] pointer-events-none mix-blend-overlay"></div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full relative group py-4 px-6 rounded-2xl bg-foreground text-background font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>

              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-background" viewBox="0 0 24 24">
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

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-4 text-muted font-bold tracking-widest uppercase rounded-full">Secure Entry</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted font-medium leading-relaxed">
              By continuing, you acknowledge that you have read and agree to our{" "}
              <Link href="#" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Privacy Policy
              </Link>.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

