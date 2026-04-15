"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { TrendingUp, ArrowLeft, ShieldCheck, Sparkles, Target } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Link 
        href="/" 
        className="absolute top-10 left-10 flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-bold no-underline"
      >
        <ArrowLeft size={20} />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-surface rounded-[2.5rem] border border-border-subtle p-10 shadow-2xl shadow-indigo-500/10 relative z-10">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <TrendingUp size={36} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-3 tracking-tighter">
              Get Started with <br />
              Spend<span className="text-primary-600">Wise</span>
            </h1>
            <p className="text-secondary font-medium">
              Securely sign in to your financial freedom journey.
            </p>
          </div>

          <div className="space-y-4 mb-10">
            {[
              { icon: ShieldCheck, text: "Your data is encrypted and private" },
              { icon: Target, text: "Set smart limits and save faster" },
              { icon: Sparkles, text: "Gain clarity on every rupee spent" }
            ].map((item, id) => (
              <div key={id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-variant/50 border border-border-subtle/30">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary-600 shadow-sm">
                  <item.icon size={20} />
                </div>
                <span className="text-sm font-bold text-secondary">{item.text}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all"
          >
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
            Sign in with Google
          </motion.button>

          <p className="mt-8 text-center text-[10px] text-muted font-bold uppercase tracking-widest leading-loose">
            By signing in, you agree to our <br />
            Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
