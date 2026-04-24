"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  MousePointerClick,
  Sparkles,
  PieChart,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Brain,
  Plus,
  IndianRupee,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Download,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "One-Tap Identity",
    description: "Start your journey in seconds with Google Auth. No passwords to remember, just pure security and simplicity.",
    icon: MousePointerClick,
    color: "from-blue-500 to-indigo-600",
    mockup: "auth",
  },
  {
    number: "02",
    title: "Effortless Logging",
    description: "Record your spending as it happens. Categorize by Needs, Wants, or Investments with localized Rupee (₹) support.",
    icon: Plus,
    color: "from-emerald-500 to-teal-600",
    mockup: "log",
  },
  {
    number: "03",
    title: "AI Forensic Analysis",
    description: "Our proprietary AI performs a deep-tissue scan of your habits, identifying hidden leaks and suggesting smart reallocations.",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    mockup: "ai",
  },
  {
    number: "04",
    title: "Financial Mastery",
    description: "Watch your savings grow. Export reports, set smart limits, and achieve your goals with real-time data visualizers.",
    icon: PieChart,
    color: "from-amber-500 to-orange-600",
    mockup: "stats",
  },
];

/* ──────────────────────────────────────────────
   MOCKUP COMPONENTS
────────────────────────────────────────────── */

/* ──────────────────────────────────────────────
   MOCKUP COMPONENTS
────────────────────────────────────────────── */

function AuthMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-10 shadow-2xl max-w-sm mx-auto relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-600 to-violet-600" />
      <div className="text-center space-y-8">
        <div className="w-20 h-20 bg-primary-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-500">
          <TrendingUp className="text-primary-600" size={36} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">Secure Entry</h3>
          <p className="text-xs text-secondary font-bold uppercase tracking-widest">Premium Finance Portal</p>
        </div>
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-4 w-full py-5 rounded-2xl bg-foreground text-background font-black text-sm hover:scale-[1.02] transition-all cursor-default shadow-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          </div>
          <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-40">Biometric & OAuth Ready</div>
        </div>
      </div>
    </div>
  );
}

function LogMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary-500">Instant Log</h4>
          <span className="text-xl font-black">Add Expense</span>
        </div>
        <div className="px-4 py-1.5 bg-success/10 text-success text-[10px] font-black rounded-full border border-success/20">LIVE</div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Amount (₹)</label>
          <div className="p-5 bg-surface-variant/30 rounded-2xl border border-border-subtle text-3xl font-black text-foreground tabular-nums">
            ₹ 2,450.00
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Core Category</label>
          <div className="flex gap-3">
            {['Needs', 'Wants'].map((cat, i) => (
              <div key={cat} className={`flex-1 py-3 rounded-xl text-xs font-black border text-center transition-all ${i === 1 ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20' : 'bg-surface border-border-subtle text-secondary'}`}>
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-center shadow-xl hover:scale-[1.02] transition-transform cursor-default">
        Confirm Transaction
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
        <Brain size={200} className="text-foreground" />
      </div>
      <div className="relative z-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Sparkles size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Forensic AI</span>
            <span className="text-xl font-black">Smart Insights</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-indigo-500/5 rounded-[1.5rem] border border-indigo-500/10 space-y-2">
            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Subscription Audit</h5>
            <p className="text-xs font-bold text-secondary leading-relaxed">
              Detected 3 overlapping streaming services. Canceling 2 would save <b>₹1,499/mo</b>.
            </p>
          </div>
          <div className="p-5 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10 space-y-2">
            <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Wealth Reallocation</h5>
            <p className="text-xs font-bold text-secondary leading-relaxed">
              Your "Needs" are 12% below budget. Invest the surplus <b>₹5,000</b> for 12% CAGR.
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest">AI Confidence</span>
          <span className="text-sm font-black text-indigo-600">98.4%</span>
        </div>
      </div>
    </div>
  );
}

function StatsMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-2xl space-y-8 h-full relative">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Visual Trends</span>
          <span className="text-xl font-black">Net Worth Growth</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center">
          <ArrowRight size={20} className="text-muted" />
        </div>
      </div>

      <div className="space-y-6">
        {[
          { label: 'JAN', value: '₹45k', percent: '65%', color: 'bg-indigo-500' },
          { label: 'FEB', value: '₹52k', percent: '75%', color: 'bg-indigo-500' },
          { label: 'MAR', value: '₹68k', percent: '95%', color: 'bg-primary-600' }
        ].map((item, i) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
              <span className="text-muted">{item.label}</span>
              <span className="text-foreground">{item.value}</span>
            </div>
            <div className="h-3 bg-surface-variant rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: item.percent }}
                transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
                className={`h-full ${item.color} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-border-subtle grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">Total Saved</p>
          <p className="text-2xl font-black text-success tabular-nums">₹1.2L</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">Efficiency</p>
          <p className="text-2xl font-black text-primary-600">92%</p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 overflow-x-hidden">
        {/* HERO SECTION */}
        <section className="px-5 md:px-10 max-w-7xl mx-auto text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-black mb-8 tracking-widest uppercase shadow-sm border border-primary-100"
          >
            <Sparkles size={16} strokeWidth={3} className="animate-pulse" />
            Designed for Perfection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-8 tracking-tighter leading-[0.9]"
          >
            Simplicity Meet<br />
            <span className="italic bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Forensic Power.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-secondary max-w-3xl mx-auto font-medium"
          >
            Take a deep dive into how SpendWise transforms your financial chaos into a stream of actionable intelligence and growth.
          </motion.p>
        </section>

        {/* STEPS SECTION */}
        <section className="px-5 md:px-10 max-w-6xl mx-auto space-y-40">
          {steps.map((step, i) => (
            <div key={i} className={`flex flex-col lg:flex-row items-center gap-16 lg:gap-24 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Content Area */}
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex-1 space-y-8"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-xl shadow-indigo-500/10`}>
                  <step.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-4">
                  <span className="text-sm font-black text-primary-600 uppercase tracking-[0.3em]">Step {step.number}</span>
                  <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">{step.title}</h2>
                  <p className="text-lg md:text-xl text-secondary leading-relaxed font-medium">{step.description}</p>
                </div>

                <ul className="space-y-4">
                  {['Enterprise-grade security', 'Instant synchronization', 'Data-driven insights'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-bold text-secondary">
                      <CheckCircle2 size={18} className="text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Visual Demo Area */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: i % 2 === 0 ? 15 : -15 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex-1 w-full max-w-lg lg:max-w-none perspective-1000"
              >
                <div className="relative group">
                  {/* Decorative backgrounds */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity`} />

                  {/* Component Mockups */}
                  <div className="relative z-10 transition-transform group-hover:translate-y-[-10px] duration-500">
                    {step.mockup === 'auth' && <AuthMockup />}
                    {step.mockup === 'log' && <LogMockup />}
                    {step.mockup === 'ai' && <AIMockup />}
                    {step.mockup === 'stats' && <StatsMockup />}
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </section>

        {/* DOWNLOAD CTA BOTTOM */}
        <section className="px-5 md:px-10 max-w-7xl mx-auto mt-40">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-foreground rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-500/10 blur-[120px] rounded-full" />
            <div className="relative z-10 space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 text-background/80 text-[10px] font-black tracking-widest uppercase">
                <Sparkles size={14} /> Ready for the next level?
              </div>
              <h2 className="text-4xl md:text-7xl font-black text-background tracking-tighter leading-tight">
                Experience Finance <br />
                Without Boundaries.
              </h2>
              <p className="text-background/70 text-xl font-medium max-w-2xl mx-auto">
                Install SpendWise on your device today and join thousands of Indians mastering their money with forensic precision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <button
                  onClick={() => window.dispatchEvent(new Event('showPwaInstall'))}
                  className="px-12 py-5 bg-background text-foreground rounded-2xl font-black text-xl shadow-xl hover:translate-y-[-5px] transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                >
                  <Download size={24} strokeWidth={3} />
                  Download App
                </button>
                <Link href="/contact" className="px-12 py-5 bg-transparent text-background border border-background/20 rounded-2xl font-black text-xl hover:bg-background/5 transition-all w-full sm:w-auto">
                  Help Center
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </>
  );
}
