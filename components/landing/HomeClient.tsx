"use client";

import { motion, Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  IndianRupee,
  Target,
  PieChart,
  Smartphone,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Star,
  Users,
  TrendingDown,
  Brain,
  Zap,
  Lock,
  Download,
  ShieldCheck,
} from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";

/* ──────────────────────────────────────────────
   DATA
 ────────────────────────────────────────────── */

const coreBenefits = [
  {
    icon: IndianRupee,
    title: "Rupee-Native",
    description: "Designed for the Indian economy with ₹ formatting and UPI tracking.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: Brain,
    title: "Forensic AI",
    description: "Automatically investigates your spending to find hidden savings.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade",
    description: "Your data is encrypted and secure with Google OAuth protection.",
    color: "from-emerald-500 to-teal-600"
  }
];

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Software Engineer",
    content: "SpendWise changed how I manage my money. The visuals are amazing.",
    avatar: "RS"
  },
  {
    name: "Priya Patel",
    role: "Teacher",
    content: "Simple, clean, and effective. I love the offline PWA support.",
    avatar: "PP"
  }
];

/* ──────────────────────────────────────────────
   VARIANTS
 ────────────────────────────────────────────── */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

/* ──────────────────────────────────────────────
   COMPONENTS
 ────────────────────────────────────────────── */

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">
        {/* HERO SECTION */}
        <section className="relative min-h-[90dvh] flex items-center pt-24 pb-20 px-5 md:px-10 overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary-500/5 rounded-full blur-[160px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />
          
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-10 relative z-10 text-center lg:text-left"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 text-[10px] font-black tracking-widest uppercase mx-auto lg:mx-0"
              >
                <Sparkles size={14} className="animate-pulse" />
                Smart Finance for India
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.85] tracking-tightest"
              >
                Wealth <br />
                <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent italic">Simplified.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl md:text-2xl text-secondary max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
              >
                Track every rupee, set smart goals, and let AI find your savings. 
                The simplest expense tracker designed for the modern Indian lifestyle.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5"
              >
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 rounded-3xl bg-foreground text-background font-black text-xl shadow-xl hover:translate-y-[-4px] transition-all active:scale-95 group"
                >
                  Get Started Free
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => window.dispatchEvent(new Event('showPwaInstall'))}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 rounded-3xl bg-surface border-2 border-border-subtle text-foreground font-black text-xl hover:bg-surface-variant transition-all active:scale-95"
                >
                  <Download size={20} />
                  Install App
                </button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center justify-center lg:justify-start gap-8 pt-8 opacity-60"
              >
                <div className="flex flex-col">
                  <span className="text-2xl font-black">10K+</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Users</span>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black">4.8/5</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">User Rating</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="relative w-full"
            >
               <DashboardMockup />
               {/* Decorative floating elements */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -top-10 -right-10 p-4 rounded-2xl bg-success/10 backdrop-blur-md border border-success/20 hidden md:block"
               >
                  <TrendingDown className="text-success" size={24} />
               </motion.div>
               <motion.div 
                 animate={{ y: [0, 10, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-primary-500/10 backdrop-blur-md border border-primary-500/20 hidden md:block"
               >
                  <Zap className="text-primary-500" size={24} />
               </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CORE BENEFITS SECTION */}
        <section className="py-32 bg-surface-variant/10">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black tracking-tightest mb-6">Financial Peace, <br /> <span className="text-primary-600">Built-In.</span></h2>
               <p className="text-xl text-secondary font-medium">Everything you need, nothing you don't.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {coreBenefits.map((benefit, i) => (
                 <motion.div
                   key={i}
                   whileHover={{ y: -5 }}
                   className="p-10 rounded-[3rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl transition-all"
                 >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-8 text-white shadow-lg`}>
                       <benefit.icon size={28} />
                    </div>
                    <h3 className="text-2xl font-black mb-4">{benefit.title}</h3>
                    <p className="text-secondary font-medium leading-relaxed">{benefit.description}</p>
                 </motion.div>
               ))}
            </div>

            <div className="mt-20 text-center">
               <Link 
                 href="/features" 
                 className="inline-flex items-center gap-2 text-xl font-black text-primary-600 hover:gap-4 transition-all"
               >
                 Explore all capabilities <ArrowRight />
               </Link>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF SECTION */}
        <section className="py-32">
           <div className="max-w-7xl mx-auto px-5 md:px-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="space-y-8">
                    <h2 className="text-5xl font-black tracking-tightest leading-none">Indians saving <br /> <span className="italic underline decoration-primary-500/20">smarter</span> every day.</h2>
                    <div className="flex items-center gap-1 text-yellow-400">
                       {[1,2,3,4,5].map(i => <Star key={i} size={24} fill="currentColor" />)}
                       <span className="ml-4 text-foreground font-black text-xl">4.8/5 Rating</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {testimonials.map((t, i) => (
                      <div key={i} className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle italic text-lg font-medium relative">
                         "{t.content}"
                         <div className="mt-6 flex items-center gap-3 not-italic">
                            <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center font-black text-primary-600 text-xs">{t.avatar}</div>
                            <div>
                               <div className="text-sm font-black">{t.name}</div>
                               <div className="text-[10px] font-bold text-muted uppercase">{t.role}</div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* CLEAN CTA SECTION */}
        <section className="py-32 px-5 md:px-10 max-w-6xl mx-auto">
           <div className="rounded-[4rem] bg-foreground p-12 md:p-24 text-center text-background relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 blur-[100px] rounded-full" />
              <div className="relative z-10 space-y-10">
                 <h2 className="text-5xl md:text-7xl font-black tracking-tightest leading-[0.9]">
                    Your Wallet, <br /> <span className="text-primary-500 italic">Redefined.</span>
                 </h2>
                 <p className="text-xl md:text-2xl text-background/70 font-medium max-w-2xl mx-auto">
                    Join 10,000+ Indians who are taking control of their financial destiny with SpendWise.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                    <Link
                      href="/login"
                      className="w-full sm:w-auto px-12 py-6 rounded-3xl bg-background text-foreground font-black text-2xl shadow-xl hover:translate-y-[-5px] transition-all"
                    >
                      Start Free Today
                    </Link>
                    <div className="flex items-center gap-2 text-background/50 font-black uppercase tracking-widest text-[10px]">
                       <Lock size={16} /> No credit card required
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
      
      <style jsx global>{`
        .tracking-tightest {
          letter-spacing: -0.05em;
        }
      `}</style>
    </>
  );
}
