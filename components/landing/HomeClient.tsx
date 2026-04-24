"use client";

import { motion, Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import {
  IndianRupee,
  Target,
  PieChart,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  ChevronRight,
  Plus,
  BarChart3,
  MousePointerClick,
  Layers,
  Sparkles,
  CheckCircle,
  Star,
  Users,
  TrendingDown,
  Brain,
  Zap,
  Lock,
  Globe,
  Bell,
  TrendingUp,
  Download,
} from "lucide-react";

/* ──────────────────────────────────────────────
   DATA
────────────────────────────────────────────── */

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Software Engineer",
    content: "SpendWise has completely changed how I manage my expenses. The visual charts are amazing and help me understand my spending patterns.",
    avatar: "RS",
    rating: 5
  },
  {
    name: "Priya Patel",
    role: "Teacher",
    content: "Simple, clean, and effective. I love how it tracks my daily expenses and shows me where I can save more.",
    avatar: "PP",
    rating: 5
  },
  {
    name: "Amit Kumar",
    role: "Business Owner",
    content: "As a small business owner, SpendWise helps me keep track of both personal and business expenses. Highly recommended!",
    avatar: "AK",
    rating: 5
  }
];

const features = [
  {
    icon: IndianRupee,
    title: "Rupee-Ready",
    description: "Designed specifically for the Indian economy with localized ₹ formatting and GST tracking.",
    color: "from-blue-500 to-indigo-600",
    size: "large",
    benefits: ["Auto ₹ conversion", "Tax-ready exports", "GST categorizations"]
  },
  {
    icon: Brain,
    title: "AI Insights",
    description: "Our forensic AI analyzes your spending habits to find hidden leaks.",
    color: "from-violet-500 to-purple-600",
    size: "small",
    benefits: ["Pattern detection", "Savings advice"]
  },
  {
    icon: Target,
    title: "Smart Goals",
    description: "Define targets and watch your progress unfold in real-time.",
    color: "from-emerald-500 to-teal-600",
    size: "small",
    benefits: ["Budget zones", "Goal tracking"]
  },
  {
    icon: PieChart,
    title: "Visual Wealth",
    description: "Beautifully categorized charts that make complex data clear.",
    color: "from-rose-500 to-red-600",
    size: "large",
    benefits: ["Interactive charts", "Category heatmaps", "Trend forecasting"]
  },
  {
    icon: Smartphone,
    title: "PWA Power",
    description: "Works offline, installs as a native app on your home screen.",
    color: "from-amber-500 to-orange-600",
    size: "small",
    benefits: ["Zero lag", "Offline sync"]
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade",
    description: "Your data is encrypted and secure with Google OAuth.",
    color: "from-sky-500 to-blue-600",
    size: "small",
    benefits: ["OAuth 2.0", "Privacy first"]
  }
];

const stats = [
  { icon: Users, value: "10K+", label: "Active Indians" },
  { icon: TrendingDown, value: "₹50L+", label: "Total Savings" },
  { icon: Star, value: "4.8/5", label: "App Store Rating" }
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

function FeatureCard({ feature }: { feature: any }) {
  const isLarge = feature.size === "large";
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className={`p-8 rounded-[2.5rem] bg-surface border border-border-subtle group transition-all duration-300 hover:shadow-2xl hover:shadow-primary-600/10 ${
        isLarge ? "md:col-span-2 md:row-span-1" : "col-span-1"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-primary-600/10 group-hover:scale-110 transition-transform`}>
          <feature.icon className="text-white" size={28} strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">{feature.title}</h3>
        <p className="text-lg text-secondary leading-relaxed mb-6 font-medium">{feature.description}</p>
        
        {isLarge && (
          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feature.benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-secondary font-bold">
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                   <CheckCircle size={12} className="text-primary-600" />
                </div>
                {benefit}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">
        {/* HERO SECTION */}
        <section className="relative min-h-[95dvh] flex items-center pt-24 pb-20 px-5 md:px-10 overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse [animation-delay:2s]" />
          
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-12 relative z-10 text-left"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[10px] font-black tracking-[0.2em] uppercase"
              >
                <Sparkles size={14} className="animate-pulse" />
                Next-Gen Personal Finance
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.85] tracking-tightest"
              >
                Your Wealth <br />
                <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent italic">Under Control.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl md:text-2xl text-secondary max-w-xl font-medium leading-relaxed"
              >
                SpendWise transforms complex financial data into effortless insights. 
                Built for India, designed for simplicity, powered by intelligence.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center gap-6"
              >
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-[2.5rem] bg-foreground text-background font-black text-xl shadow-2xl hover:translate-y-[-4px] transition-all active:scale-95 group overflow-hidden"
                >
                  Start Your Journey
                  <ArrowRight size={20} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => window.dispatchEvent(new Event('showPwaInstall'))}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-[2.5rem] bg-surface border-2 border-border-subtle text-foreground font-black text-xl hover:bg-surface-variant transition-all active:scale-95"
                >
                  <Download size={20} strokeWidth={2} />
                  Install App
                </button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center gap-8 pt-10 border-t border-border-subtle"
              >
                {stats.map((stat, i) => (
                  <div key={i} className="text-left">
                    <div className="text-3xl font-black text-foreground tabular-nums">{stat.value}</div>
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Image Container */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="relative lg:h-[700px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent blur-[120px] rounded-full -z-10 animate-pulse" />
              <div className="relative w-full max-w-[650px]">
                <Image
                  src="/hero-mockup.png"
                  alt="SpendWise Premium Dashboard Mockup"
                  width={650}
                  height={650}
                  className="drop-shadow-[0_40px_80px_rgba(79,70,229,0.25)] hover:scale-[1.02] transition-transform duration-1000 pointer-events-none"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* QUICK INSIGHTS SECTION */}
        <section className="py-24 bg-surface-variant/10">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-5 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-[10px] font-black tracking-widest uppercase">
                  <Zap size={14} /> Real-Time Analytics
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-foreground leading-[0.9] tracking-tightest">
                  Financial Clarity <br />
                  <span className="text-primary-600">In Seconds.</span>
                </h2>
                <p className="text-lg text-secondary font-medium leading-relaxed">
                  No more spreadsheets. No more guessing. SpendWise automatically categorizes your expenses and gives you a real-time pulse of your financial health.
                </p>
                <div className="space-y-4">
                  {[
                    "Auto-categorization of Rupee transactions",
                    "Daily, weekly, and monthly spending trends",
                    "Budget leak detection with AI insights"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-foreground font-bold">
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white">
                        <CheckCircle size={14} />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle shadow-xl space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <PieChart size={24} />
                  </div>
                  <h3 className="text-xl font-black">Visual Breakdown</h3>
                  <p className="text-sm text-secondary font-medium italic">"You spent 15% more on Dining this week than your average."</p>
                  <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[65%] rounded-full" />
                  </div>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle shadow-xl space-y-6 mt-6 sm:mt-12">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <TrendingDown size={24} />
                  </div>
                  <h3 className="text-xl font-black">Smart Savings</h3>
                  <p className="text-sm text-secondary font-medium italic">"Detected an unused OTT subscription. Save ₹499/mo."</p>
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                    <Sparkles size={16} /> Insight Generated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="py-32 px-5 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-primary-600 font-black tracking-widest uppercase text-sm"
            >
              FORENSIC CAPABILITIES
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.9] tracking-tightest"
            >
              Master Your Money <br />
              With <span className="text-primary-600">Forensic Precision.</span>
            </motion.h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
          >
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} />
            ))}
          </motion.div>
        </section>

        {/* TESTIMONIALS - PREMIUM CARD STYLE */}
        <section className="py-32 bg-surface-variant/20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-10 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center h-full">
              <div className="space-y-8">
                <h2 className="text-5xl md:text-7xl font-black text-foreground leading-tight tracking-tightest">
                  Indians saving <br /> 
                  <span className="text-primary-600 italic underline decoration-indigo-200">smarter</span> every day.
                </h2>
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="ml-8 self-center">
                    <div className="text-xl font-black text-foreground">10,000+ Users</div>
                    <div className="text-sm font-bold text-muted">Across 20+ Indian Cities</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {testimonials.map((testimonial, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-10 rounded-[3rem] premium-card border border-border-subtle"
                  >
                    <div className="flex items-center gap-1 mb-6 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((_, idx) => (
                        <Star key={idx} size={18} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-xl md:text-2xl text-foreground font-bold italic leading-tight mb-8">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-black text-xl">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="text-lg font-black text-foreground">{testimonial.name}</div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest">{testimonial.role}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DOWNLOAD CTA SECTION */}
        <section id="cta" className="py-32 px-5 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto rounded-[5rem] bg-foreground p-12 md:p-32 text-center text-background relative overflow-hidden shadow-2xl"
          >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 text-background/80 text-[10px] font-black tracking-widest uppercase">
                 <Smartphone size={14} /> Available as PWA
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tightest leading-[0.9]">
                Your Wallet, <br />
                <span className="text-primary-500 italic underline decoration-primary-500/30">Everywhere.</span>
              </h2>
              <p className="text-xl md:text-2xl text-background/70 font-medium leading-relaxed">
                Install SpendWise on your home screen for instant access, offline tracking, and a premium full-screen experience. No App Store needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => window.dispatchEvent(new Event('showPwaInstall'))}
                  className="w-full sm:w-auto px-16 py-7 rounded-[2.5rem] bg-background text-foreground font-black text-2xl shadow-2xl hover:translate-y-[-5px] transition-all active:scale-95 flex items-center justify-center gap-4"
                >
                  <Download size={28} strokeWidth={3} />
                  Download App
                </button>
                <div className="text-background/50 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   <Lock size={16} /> 100% Free & Secure
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
      
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 5s linear infinite;
        }
        .tracking-tightest {
          letter-spacing: -0.05em;
        }
      `}</style>
    </>
  );
}
