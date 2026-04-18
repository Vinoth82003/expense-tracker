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

function AuthMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl max-w-sm mx-auto relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
      <div className="text-center space-y-6">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="text-primary-600" size={28} />
        </div>
        <h3 className="text-xl font-black">Welcome to SpendWise</h3>
        <p className="text-sm text-secondary font-medium">India's Premium Finance Tracker</p>
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-border-subtle hover:bg-surface-variant transition-colors cursor-default">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.61 0 3.05.56 4.19 1.64l3.12-3.12C17.38 1.65 14.89 1 12 1 7.48 1 3.66 3.99 2.12 8.13l3.65 2.84c.82-2.45 3.12-4.23 6.23-4.93z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.37 3.59l3.68 2.86c2.14-1.98 3.74-4.88 3.74-8.55z" />
              <path fill="#FBBC05" d="M5.77 14.63c-.34-1.02-.53-2.1-.53-3.23s.19-2.21.53-3.23L2.12 5.33C1.04 7.39 0 9.87 0 12.5s1.04 5.11 2.12 7.17l3.65-3.04z" />
              <path fill="#34A853" d="M12 23c3.15 0 5.79-1.03 7.72-2.8l-3.68-2.86c-1.09.73-2.49 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.95l-3.65 3.04C3.66 20.01 7.48 23 12 23z" />
            </svg>
            <span className="font-bold text-sm">Continue with Google</span>
          </div>
          <div className="h-2 w-1/2 bg-surface-variant mx-auto rounded-full animate-pulse opacity-40" />
        </div>
      </div>
    </div>
  );
}

function LogMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 shadow-2xl space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-black text-sm uppercase tracking-widest text-primary-500">Record Expense</h4>
        <div className="px-3 py-1 bg-success/10 text-success text-[10px] font-black rounded-full">LIVE PREVIEW</div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted uppercase">Amount (₹)</label>
          <div className="p-4 bg-surface-variant/50 rounded-2xl border border-border-subtle text-2xl font-black text-foreground">
            2,450.00
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted uppercase">Category</label>
          <div className="flex gap-2">
            {['Needs', 'Wants', 'Invest'].map((cat, i) => (
              <div key={cat} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${i === 1 ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface border-border-subtle text-secondary'}`}>
                {cat}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted uppercase">Merchant</label>
          <div className="p-3 bg-surface-variant/50 rounded-2xl border border-border-subtle text-sm font-semibold text-secondary">
            Weekly Groceries
          </div>
        </div>
      </div>
      <div className="w-full py-4 bg-primary-600 rounded-2xl text-white font-black text-center shadow-lg shadow-primary-600/20">
        Add Transaction
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <Brain size={120} className="text-indigo-500" />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <span className="font-black text-xs uppercase tracking-widest">AI Forensic Insights</span>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <h5 className="text-xs font-black text-indigo-600 flex items-center gap-2 mb-2">
              <Smartphone size={14} />
              Subscription Leak
            </h5>
            <p className="text-[11px] font-bold text-secondary leading-relaxed">
              Detected 3 unused streaming services totaling <b>₹1,499/mo</b>. Canceling these would save you <b>₹17,988</b> annually.
            </p>
          </div>
          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
            <h5 className="text-xs font-black text-emerald-600 flex items-center gap-2 mb-2">
              <TrendingUp size={14} />
              Savings Opportunity
            </h5>
            <p className="text-[11px] font-bold text-secondary leading-relaxed">
              Your "Needs" are 12% below budget this month. Reallocate <b>₹5,000</b> to your SIP for maximum growth.
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] font-black text-muted uppercase">Confidence Score</span>
          <span className="text-xs font-black text-indigo-600">98.4%</span>
        </div>
      </div>
    </div>
  );
}

function StatsMockup() {
  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 shadow-2xl space-y-6 h-full">
       <div className="flex items-center justify-between mb-2">
        <h4 className="font-black text-sm uppercase tracking-widest text-primary-500">Wealth Growth</h4>
        <ArrowRight size={16} className="text-muted" />
      </div>

      <div className="space-y-6">
        {[
          { label: 'JAN', value: '₹45k', percent: '65%' },
          { label: 'FEB', value: '₹52k', percent: '75%' },
          { label: 'MAR', value: '₹68k', percent: '95%' }
        ].map((item, i) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
              <span className="text-muted">{item.label}</span>
              <span className="text-foreground">{item.value}</span>
            </div>
            <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: item.percent }}
                transition={{ duration: 1, delay: i * 0.2 }}
                className={`h-full bg-gradient-to-r ${i === 2 ? 'from-primary-600 to-violet-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'from-surface-variant to-muted'} rounded-full`} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border-subtle grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-[10px] font-black text-muted uppercase">Net Savings</p>
          <p className="text-lg font-black text-success">₹1,24,000</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-muted uppercase">Efficiency</p>
          <p className="text-lg font-black text-primary-600">92%</p>
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

        {/* CTA BOTTOM */}
        <section className="px-5 md:px-10 max-w-7xl mx-auto mt-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-indigo-600 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/20"
          >
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-white/10 blur-3xl rounded-full" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Ready to redesign your finances?</h2>
              <p className="text-white/80 text-xl font-medium max-w-2xl mx-auto">
                Join thousands of users who have found clarity and growth through SpendWise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                <Link href="/login" className="px-10 py-5 bg-white text-indigo-700 rounded-2xl font-black text-lg shadow-xl hover:translate-y-[-5px] transition-all w-full sm:w-auto">
                  Get Started Free
                </Link>
                <Link href="/contact" className="px-10 py-5 bg-indigo-700 text-white border border-indigo-500 rounded-2xl font-black text-lg hover:bg-indigo-800 transition-all w-full sm:w-auto">
                  Talk to Support
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
