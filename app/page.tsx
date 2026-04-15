"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
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
  Sparkles
} from "lucide-react";

/* ──────────────────────────────────────────────
   DATA & VARIANTS
────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
} as const;

const features = [
  {
    icon: IndianRupee,
    title: "Rupee-Ready",
    description: "Designed for India. Localized ₹ formatting and seamless currency management for global travelers.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: Target,
    title: "Goal Oriented",
    description: "Define your monthly targets and watch your progress unfold. No more financial guesswork.",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: PieChart,
    title: "Instant Analytics",
    description: "Visualize your spending patterns with beautifully categorized charts generated in real-time.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: Smartphone,
    title: "Always With You",
    description: "A fast, lightweight PWA experience that puts your finances in your pocket, even without internet.",
    color: "from-amber-500 to-orange-600"
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    description: "Your data stays yours. Secure Google Auth login without ever needing to manage another password.",
    color: "from-rose-500 to-red-600"
  },
  {
    icon: BarChart3,
    title: "Data Freedom",
    description: "Transparency is key. Export your transaction history to CSV whenever you need a deeper look.",
    color: "from-sky-500 to-blue-600"
  }
];

const steps = [
  {
    icon: MousePointerClick,
    title: "Quick Sign-In",
    desc: "Join in one click with Google. Secure and password-free access."
  },
  {
    icon: Layers,
    title: "Log Daily Spend",
    desc: "Quickly enter expenses by category as they happen."
  },
  {
    icon: Sparkles,
    title: "Gain Clarity",
    desc: "Review your insights and adjust your habits for long-term saving."
  }
];

/* ──────────────────────────────────────────────
   COMPONENTS
────────────────────────────────────────────── */

function FeatureCard({ feature }: { feature: any }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className="p-8 rounded-3xl bg-surface border border-border-subtle hover:border-primary-600/20 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-primary-600/10`}>
        <feature.icon className="text-white" size={28} strokeWidth={2.5} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
      <p className="text-secondary leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      
      <main className="overflow-x-hidden pt-20">
        {/* HERO SECTION */}
        <section className="relative min-h-[85dvh] flex items-center justify-center py-20 px-5 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-5%] left-[10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-violet-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center relative z-10"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-extrabold mb-8 tracking-wide uppercase shadow-sm"
            >
              <Sparkles size={16} strokeWidth={3} className="text-indigo-600" />
              Rupee-Native Financial Freedom
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-8 leading-[0.95] tracking-tighter"
            >
              Master Your <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic">Spending Journey</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-2xl text-secondary mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              An effortless way to track daily costs, analyze habits, and save smarter every month.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Link href="/login" passHref legacyBehavior>
                <motion.a
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-600/30"
                >
                  Start Tracking
                  <ArrowRight size={20} strokeWidth={3} />
                </motion.a>
              </Link>
              <motion.a
                whileHover={{ scale: 1.05, backgroundColor: "var(--bg-surface-variant)" }}
                whileTap={{ scale: 0.95 }}
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-surface border-2 border-border-subtle text-foreground font-black text-lg transition-all"
              >
                Learn More
              </motion.a>
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 px-5 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight tracking-tight"
            >
              Everything you need, <br />
              <span className="text-primary-600">nothing you don't.</span>
            </motion.h2>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} />
            ))}
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-surface-variant">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">Simplicity in Motion</h2>
              <p className="text-lg text-secondary font-medium">Get set up in less than a minute.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-[2.75rem] left-[15%] right-[15%] h-1 border-t-2 border-dashed border-border-hover -z-0" />
              
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  <div className="w-20 h-20 rounded-full bg-surface border-4 border-primary-100 flex items-center justify-center text-primary-600 mb-6 shadow-sm">
                    <step.icon size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-2">{step.title}</h3>
                  <p className="text-secondary font-medium px-4">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section id="cta" className="py-24 px-5 md:px-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[100%] bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-none">
                Ready to take <br />
                the wheel?
              </h2>
              <p className="text-xl text-white/80 mb-12 max-w-xl mx-auto font-medium">
                SpendWise is free for everyone. Start tracking properly and unlock your full financial potential.
              </p>
              <Link href="/login" passHref legacyBehavior>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-4 px-12 py-6 rounded-3xl bg-white text-indigo-700 font-black text-xl shadow-xl hover:shadow-2xl transition-all"
                >
                  Join Now
                  <ChevronRight size={24} strokeWidth={3} />
                </motion.a>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
