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
  Sparkles,
  CheckCircle,
  Star,
  Users,
  TrendingDown,
  Brain
} from "lucide-react";

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

const faqs = [
  {
    question: "Is SpendWise free to use?",
    answer: "Yes, SpendWise is completely free for personal use. No hidden fees or premium subscriptions."
  },
  {
    question: "How secure is my data?",
    answer: "Your data is encrypted and stored securely. We use OAuth authentication and never store passwords."
  },
  {
    question: "Can I export my expense data?",
    answer: "Yes, you can export your expenses to CSV format for tax purposes or personal records."
  },
  {
    question: "Does it work offline?",
    answer: "Yes, SpendWise is a PWA that works offline. You can add expenses without internet and sync when online."
  },
  {
    question: "What currencies does it support?",
    answer: "SpendWise supports multiple currencies with Rupee (₹) as the primary currency for Indian users."
  },
  {
    question: "Can I categorize my expenses?",
    answer: "Yes, expenses are categorized into Needs and Wants with detailed subcategories for better tracking."
  }
];

/* ──────────────────────────────────────────────
   DATA & VARIANTS
────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
} as const;

const features = [
  {
    icon: IndianRupee,
    title: "Rupee-Ready",
    description: "Designed for India. Localized ₹ formatting and seamless currency management for global travelers.",
    color: "from-blue-500 to-indigo-600",
    benefits: ["Auto ₹ conversion", "Tax-ready exports", "Multi-currency support"]
  },
  {
    icon: Target,
    title: "Goal Oriented",
    description: "Define your monthly targets and watch your progress unfold. No more financial guesswork.",
    color: "from-emerald-500 to-teal-600",
    benefits: ["Smart budgeting", "Progress tracking", "Savings goals"]
  },
  {
    icon: PieChart,
    title: "Instant Analytics",
    description: "Visualize your spending patterns with beautifully categorized charts generated in real-time.",
    color: "from-violet-500 to-purple-600",
    benefits: ["Real-time charts", "Category insights", "Trend analysis"]
  },
  {
    icon: Smartphone,
    title: "Always With You",
    description: "A fast, lightweight PWA experience that puts your finances in your pocket, even without internet.",
    color: "from-amber-500 to-orange-600",
    benefits: ["Offline access", "Mobile optimized", "Quick sync"]
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    description: "Your data stays yours. Secure Google Auth login without ever needing to manage another password.",
    color: "from-rose-500 to-red-600",
    benefits: ["OAuth security", "Data encryption", "Privacy first"]
  },
  {
    icon: BarChart3,
    title: "Data Freedom",
    description: "Transparency is key. Export your transaction history to CSV whenever you need a deeper look.",
    color: "from-sky-500 to-blue-600",
    benefits: ["CSV exports", "Data portability", "Tax reports"]
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

const stats = [
  { icon: Users, value: "10K+", label: "Active Users" },
  { icon: TrendingDown, value: "₹50L+", label: "Money Saved" },
  { icon: Star, value: "4.8/5", label: "User Rating" }
];

/* ──────────────────────────────────────────────
   COMPONENTS
────────────────────────────────────────────── */

function FeatureCard({ feature }: { feature: any }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className="p-8 rounded-3xl bg-surface border border-border-subtle hover:border-primary-600/20 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-primary-600/10 group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className="text-white" size={28} strokeWidth={2.5} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
      <p className="text-secondary leading-relaxed mb-4">{feature.description}</p>
      <ul className="space-y-2">
        {feature.benefits.map((benefit: string, idx: number) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-secondary">
            <CheckCircle size={16} className="text-accent-600 flex-shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function StatCard({ stat }: { stat: any }) {
  return (
    <motion.div
      variants={itemVariants}
      className="text-center p-6 rounded-2xl bg-surface border border-border-subtle shadow-sm"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
        <stat.icon className="text-primary-600" size={24} />
      </div>
      <div className="text-3xl font-black text-foreground mb-2">{stat.value}</div>
      <div className="text-sm font-medium text-secondary">{stat.label}</div>
    </motion.div>
  );
}

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">
        {/* HERO SECTION */}
        <section className="relative min-h-[95dvh] flex items-center justify-center py-20 px-5 overflow-hidden">
          {/* Advanced Background Decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[160px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-violet-500/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
            <div className="absolute top-[30%] -left-20 w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto text-center relative z-10"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-border-subtle text-primary-600 text-[10px] font-black mb-10 tracking-[0.2em] uppercase shadow-xl"
            >
              <Sparkles size={14} strokeWidth={3} className="text-indigo-600 animate-pulse" />
              India's #1 Personal AI Finance Tracker
            </motion.div>
 
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-8xl lg:text-9xl font-black text-foreground mb-8 leading-[0.85] tracking-tighter"
            >
              Master Your <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent italic bg-[length:200%_auto] animate-gradient">Spending.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl lg:text-3xl text-secondary mb-14 max-w-3xl mx-auto leading-tight font-medium tracking-tight"
            >
              A beautifully simple way to track daily costs, analyze habits with AI, and grow your wealth.
              Join 10,000+ Indians saving smarter every day.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-3 px-12 py-6 rounded-[2rem] bg-indigo-600 text-white font-black text-xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all border-b-4 border-indigo-900"
                >
                  Start Saving Today
                  <ArrowRight size={24} strokeWidth={3} />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/how-it-works"
                  className="w-full flex items-center justify-center gap-3 px-12 py-6 rounded-[2rem] bg-surface border-2 border-border-subtle text-foreground font-black text-xl transition-all hover:bg-surface-variant shadow-xl"
                >
                  See How It Works
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Section with Glassmorphism */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto backdrop-blur-sm p-4 rounded-[3rem]"
            >
              {stats.map((stat, i) => (
                <StatCard key={i} stat={stat} />
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-32 px-5 md:px-10 max-w-7xl mx-auto relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary-600/5 blur-[100px] -z-10" />
          
          <div className="text-center mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-black text-foreground mb-8 leading-[0.9] tracking-tighter"
            >
              Everything you need, <br />
              <span className="text-primary-600">nothing you don't.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-2xl text-secondary max-w-2xl mx-auto font-medium"
            >
              Built for the Indian economy. Experience the perfect blend of forensic power and effortless simplicity.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} />
            ))}
          </motion.div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-32 bg-surface-variant/30 relative">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
              <div className="space-y-8">
                <motion.h2
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl md:text-6xl font-black text-foreground leading-[0.9] tracking-tighter"
                >
                  Trusted by <br />
                  <span className="text-primary-600 italic">Financial Leaders.</span>
                </motion.h2>
                <p className="text-xl text-secondary font-medium">
                  Join 10,000+ users who have transformed their relationship with money through SpendWise.
                </p>
                <div className="flex -space-x-4 items-center">
                   {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-surface bg-primary-100 flex items-center justify-center font-black text-primary-700 text-sm">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="ml-8 text-lg font-black text-foreground">10k+ Growing</div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                {testimonials.slice(0, 2).map((testimonial, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle shadow-xl hover:translate-y-[-10px] transition-all"
                  >
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, idx) => (
                        <Star key={idx} size={18} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xl text-foreground mb-8 leading-relaxed font-bold italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-black text-lg text-foreground">{testimonial.name}</div>
                        <div className="text-sm font-bold text-muted uppercase tracking-widest">{testimonial.role}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS PREVIEW */}
        <section id="how-it-works" className="py-32 px-5 md:px-10 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden text-center text-white">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-12">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                Experience the <br />
                <span className="text-indigo-400">Forensic Difference.</span>
              </h2>
              <p className="text-xl text-white/70 font-medium">
                Our AI doesn't just track—it investigates. Find hidden leaks, predict future trends, and reach your goals 3x faster.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                 {[
                   { icon: MousePointerClick, title: "Auth", desc: "Secure One-Tap" },
                   { icon: Smartphone, title: "Log", desc: "Easy Record" },
                   { icon: Brain, title: "Analyze", desc: "AI Forensic" },
                 ].map((step, idx) => (
                   <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                     <step.icon size={32} className="text-indigo-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                     <h3 className="text-xl font-black mb-1">{step.title}</h3>
                     <p className="text-sm font-bold opacity-60 uppercase tracking-widest">{step.desc}</p>
                   </div>
                 ))}
              </div>

              <div className="pt-8">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-4 px-12 py-6 rounded-3xl bg-white text-indigo-950 font-black text-xl shadow-2xl hover:translate-y-[-5px] transition-all"
                >
                  Explore Full Demo
                  <ChevronRight size={24} strokeWidth={3} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section id="cta" className="py-24 px-5 md:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto rounded-[4rem] bg-indigo-600 p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40 border-b-[8px] border-indigo-900"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[100%] bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-10">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                Ready to take <br />
                the wheel?
              </h2>
              <p className="text-xl md:text-2xl text-white/80 max-w-xl mx-auto font-medium">
                SpendWise is free for everyone. Start tracking properly and unlock your full financial potential today.
              </p>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center gap-4 px-14 py-7 rounded-[2.5rem] bg-white text-indigo-700 font-black text-2xl shadow-2xl hover:shadow-indigo-400/20 transition-all"
                >
                  Join Today
                  <ChevronRight size={28} strokeWidth={4} />
                </Link>
              </motion.div>
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
      `}</style>
    </>
  );
}
