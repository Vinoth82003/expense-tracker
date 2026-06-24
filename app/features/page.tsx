"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  IndianRupee, 
  Brain, 
  Target, 
  PieChart, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Search,
  Globe,
  Bell,
  User,
  Activity,
  ShoppingCart,
  Loader2,
  Download
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: IndianRupee,
    title: "Rupee-Ready Intelligence",
    description: "Built specifically for the Indian economy. Handles localized ₹ formatting, GST categories, and Indian bank statement styles flawlessly.",
    details: [
      "Auto-detection of UPI transaction patterns",
      "GST-ready expense categorization for business owners",
      "Localized currency formatting (Lakhs/Crores support)",
      "Financial year-based reporting (April to March)"
    ],
    color: "bg-blue-500",
    lightColor: "bg-blue-500/10",
    textColor: "text-blue-500"
  },
  {
    icon: Brain,
    title: "Forensic AI Analysis",
    description: "Our proprietary AI doesn't just track; it investigates. It finds hidden leaks and suggests behavioral changes to save you more.",
    details: [
      "Anomaly detection for unusual spending spikes",
      "Subscription leak detector for unused services",
      "Predictive balance forecasting for the month-end",
      "Personalized saving challenges based on history"
    ],
    color: "bg-violet-500",
    lightColor: "bg-violet-500/10",
    textColor: "text-violet-500"
  },
  {
    icon: Target,
    title: "Dynamic Budgeting",
    description: "Move away from rigid spreadsheets. Set dynamic goals that adapt to your lifestyle and keep you on track without feeling restricted.",
    details: [
      "Zero-based budgeting support",
      "Needs vs. Wants (50/30/20) automatic split",
      "Rollover budgets for recurring monthly categories",
      "Real-time alerts when approaching limits"
    ],
    color: "bg-emerald-500",
    lightColor: "bg-emerald-500/10",
    textColor: "text-emerald-500"
  },
  {
    icon: PieChart,
    title: "High-Fidelity Visuals",
    description: "Beautiful, interactive charts that transform dry numbers into actionable stories. Understand your wealth at a glance.",
    details: [
      "Interactive multi-layer category heatmaps",
      "Period-over-period comparison trends",
      "Net worth tracking and growth visualization",
      "Export-ready professional PDF reports"
    ],
    color: "bg-rose-500",
    lightColor: "bg-rose-500/10",
    textColor: "text-rose-500"
  },
  {
    icon: Smartphone,
    title: "PWA Native Experience",
    description: "Zero installation friction. Add to your home screen and enjoy a lightning-fast, full-screen native app experience that works offline.",
    details: [
      "Offline expense logging with auto-sync",
      "Biometric login support (FaceID/TouchID)",
      "Push notifications for budget alerts",
      "Zero-latency interface transitions"
    ],
    color: "bg-amber-500",
    lightColor: "bg-amber-500/10",
    textColor: "text-amber-500"
  },
  {
    icon: ShieldCheck,
    title: "Fortress Security",
    description: "Your financial privacy is our obsession. We use bank-grade encryption and never sell your data. You are the owner of your data.",
    details: [
      "Google OAuth 2.0 secure authentication",
      // "End-to-end data encryption at rest",
      "No manual password storage",
      "GDPR & DPDP compliant data handling"
    ],
    color: "bg-sky-500",
    lightColor: "bg-sky-500/10",
    textColor: "text-sky-500"
  }
];

const FeatureMockup = ({ index }: { index: number }) => {
  switch (index) {
    case 0:
      return (
        <div className="bg-surface rounded-[2rem] border border-border-subtle overflow-hidden flex flex-col shadow-sm w-full h-full">
          <div className="p-5 flex items-center justify-between border-b border-border-subtle bg-surface/50">
            <h3 className="text-xl font-black">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border-subtle flex-1 flex flex-col justify-center bg-surface p-2">
            {[
              { cat: "Needs", sub: "Groceries", date: "Today", amt: "-₹3,450", color: "bg-primary-500" },
              { cat: "Wants", sub: "Dining", date: "Yesterday", amt: "-₹1,200", color: "bg-tertiary-500" },
              { cat: "Needs", sub: "Transport", date: "2 May", amt: "-₹450", color: "bg-primary-500" },
            ].map((exp, i) => (
              <div key={i} className="p-3 flex items-center gap-4 hover:bg-surface-variant rounded-2xl transition-colors">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm flex-shrink-0 ${exp.color}`}>
                  {exp.sub.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm truncate">{exp.sub}</h4>
                  <div className="text-[9px] text-muted font-black uppercase tracking-widest mt-0.5 truncate">
                    {exp.date} • {exp.cat}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-black text-sm">{exp.amt.replace('-', '')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 1:
      return (
        <div className="relative w-full h-full bg-[#0a0a0c] rounded-[2rem] border border-white/10 p-6 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-violet-500/20" />
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border border-primary-500/20 border-t-primary-500 border-l-primary-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-violet-500/20 border-b-violet-500 border-r-violet-500 animate-[spin_3s_linear_reverse_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-violet-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] relative">
                <Brain size={28} className="relative z-10" />
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse" />
              </div>
            </div>
          </div>
          <h2 className="text-base font-black tracking-tighter text-white uppercase mb-6 relative z-10">
            Forensic AI <span className="text-primary-400">Processing</span>
          </h2>
          <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-primary-500/10 border border-primary-500/30 w-full relative z-10">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center text-white shrink-0">
               <Loader2 size={16} className="animate-spin" />
            </div>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">
               Synthesizing Strategic Advice
            </span>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-4 w-full justify-center h-full pt-4">
          <div className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Budget Left</div>
            <div className="text-2xl font-black text-foreground">₹12,450</div>
          </div>
          <div className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-muted/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="w-10 h-10 rounded-xl bg-surface-variant text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart size={20} />
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Daily Avg</div>
            <div className="text-2xl font-black text-foreground">₹840</div>
          </div>
        </div>
      );
    case 3:
      return (
        <div className="bg-surface rounded-[2rem] border border-border-subtle p-6 shadow-sm flex flex-col h-full w-full">
          <h3 className="text-xl font-black mb-6">Category Split</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full relative mb-8 shadow-inner" style={{ background: "conic-gradient(#6366f1 0% 60%, #5cf6f4ff 60% 100%" }}>
               <div className="absolute inset-[18px] bg-surface rounded-full shadow-sm" />
            </div>
            <div className="w-full grid grid-cols-1 gap-3">
              {[
                { name: "Needs", val: "₹24,500", color: "#6366f1" },
                { name: "Wants", val: "₹18,000", color: "#5cf6f4ff" },
                // { name: "Investments", val: "₹12,000", color: "#ec4899" }
              ].map((entry) => (
                <div key={entry.name} className="flex items-center gap-3 bg-surface-variant/30 p-3 rounded-2xl border border-border-subtle">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <div className="min-w-0 flex-1 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-muted truncate">{entry.name}</p>
                    <p className="font-black text-sm">{entry.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 pt-4">
           <div className="w-32 h-56 border-[6px] border-border-subtle rounded-[2rem] p-1 flex flex-col gap-1 relative overflow-hidden bg-surface-variant shadow-xl">
              <div className="w-10 h-1.5 bg-border-subtle mx-auto rounded-b-full absolute top-0 left-1/2 -translate-x-1/2 z-10" />
              <div className="flex-1 bg-background rounded-[1.25rem] p-3 flex flex-col gap-3 border border-border-subtle">
                 <div className="w-full h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
                    <Zap size={14} />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-surface-variant rounded-md" />
                    <div className="h-8 bg-surface-variant rounded-md" />
                 </div>
                 <div className="h-12 bg-surface-variant rounded-md mt-auto" />
              </div>
           </div>
           <div className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 border border-amber-500/20">
              <Zap size={14} /> Offline Ready
           </div>
        </div>
      );
    case 5:
      return (
         <div className="flex flex-col items-center justify-center h-full space-y-8 pt-4">
            <div className="w-24 h-24 rounded-full bg-sky-500/10 flex items-center justify-center relative shadow-inner">
               <div className="absolute inset-0 border-2 border-sky-500/30 rounded-full animate-ping opacity-20" />
               <Lock size={36} className="text-sky-500" />
            </div>
            <div className="space-y-4 w-full">
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm">
                  <ShieldCheck size={20} className="text-success" />
                  <span className="text-sm font-bold text-secondary">Secure 2FA Login option</span>
               </div>
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm">
                  <Globe size={20} className="text-success" />
                  <span className="text-sm font-bold text-secondary">OAuth 2.0 Authenticated</span>
               </div>
            </div>
         </div>
      );
    default:
      return null;
  }
};

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      
      <main className="overflow-x-hidden pt-20" id="main-content">
        {/* Background mesh (from HomeClient) */}
        <div className="fixed inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(99,102,241,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(99,102,241,0.05) 0%, transparent 70%)"
          }}
        />
        <div
          className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* HERO SECTION */}
        <section className="relative min-h-[60dvh] flex flex-col items-center justify-center py-32 px-5 md:px-10 text-center">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-8"
             style={{
               borderColor: "rgba(99,102,241,0.3)",
               background: "rgba(99,102,241,0.08)",
               color: "#6366f1",
             }}
           >
             <Zap size={14} /> Full Capability Suite
           </motion.div>
           
           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-foreground"
           >
             Engineered for <br />
             <span className="italic" style={{ color: "#6366f1" }}>Financial Mastery.</span>
           </motion.h1>
           
           <motion.p
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto font-medium"
           >
             SpendWise combines state-of-the-art forensic AI with a minimalist interface 
             designed for the modern Indian economy.
           </motion.p>
        </section>

        {/* Features List */}
        <section className="py-20 px-5 md:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-32">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}
              >
                <div className="flex-1 space-y-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border`}
                       style={{
                         background: "rgba(99,102,241,0.08)",
                         borderColor: "rgba(99,102,241,0.2)",
                         color: "#6366f1",
                       }}
                  >
                    <feature.icon size={24} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{feature.title}</h2>
                  <p className="text-xl text-secondary font-medium leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-4">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-foreground font-bold">
                        <CheckCircle size={18} style={{ color: "#6366f1" }} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-[250px] w-full lg:w-1/2 flex-1">
                   {/* Mockup Container */}
                   <div className="relative z-10 w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-border-subtle p-6"
                        style={{
                          background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
                        }}
                   >
                      <div className="flex items-center justify-between mb-6">
                         <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                            <feature.icon size={14} style={{ color: "#6366f1" }} />
                            {feature.title}
                         </div>
                         <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      </div>
                      <div className="h-[calc(100%-40px)] min-h-[300px] w-full flex items-center justify-center">
                         <FeatureMockup index={i} />
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-28 px-5 md:px-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-80px" }}
              className="relative rounded-3xl overflow-hidden border border-border-subtle text-center p-12 md:p-20"
              style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 blur-[100px] pointer-events-none -z-10"
                style={{ background: "rgba(99,102,241,0.1)" }}
              />

              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-8"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.07)",
                  color: "#6366f1",
                }}
              >
                <Lock size={12} /> Total Control Awaits
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[0.95]">
                Ready to take <br /> 
                <span className="italic" style={{ color: "#6366f1" }}>
                  total control?
                </span>
              </h2>

              <p className="text-lg text-secondary font-medium max-w-xl mx-auto mb-10">
                Join 10,000+ Indians taking full control of their financial destiny.
                Free forever. No credit card. No surprises.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base transition-all hover:-translate-y-1 active:scale-95 shadow-xl text-white"
                  style={{ background: "#6366f1" }}
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/download"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base border border-border-subtle text-secondary hover:text-foreground hover:border-primary-500/40 transition-all"
                >
                  <Download size={18} />
                  Install App
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-muted text-[11px] font-black uppercase tracking-widest">
                <Lock size={12} />
                Bank-grade security · No credit card required
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      
      <style jsx global>{`
        .tracking-tight {
          letter-spacing: -0.04em;
        }
      `}</style>
    </>
  );
}
