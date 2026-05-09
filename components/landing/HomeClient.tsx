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
  Brain,
  Zap,
  Lock,
  Download,
  ShieldCheck,
  FileText,
  Tag,
  Activity,
  CheckCircle,
  Star,
  Quote,
  User as UserIcon
} from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";
import { useEffect, useState } from "react";

/* ──────────────────────────────────────────────
   DATA
 ────────────────────────────────────────────── */

const features = [
  {
    icon: Brain,
    title: "Forensic AI Analysis",
    description:
      "Let AI dig deep into your spending. Detect hidden leaks, spot anomalies, and get personalized saving strategies — automatically.",
  },
  {
    icon: IndianRupee,
    title: "Rupee-Ready Intelligence",
    description:
      "Built for India. ₹ formatting, UPI tracking, Lakhs/Crores support, and financial-year reporting from April to March.",
  },
  {
    icon: Target,
    title: "Dynamic Budgeting",
    description:
      "Set smart monthly budgets that adapt to your lifestyle. Get real-time alerts before you overspend — not after.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    description:
      "Google OAuth 2.0 authentication, end-to-end encryption, and zero password storage. Your data stays yours.",
  },
  {
    icon: FileText,
    title: "PDF Report Export",
    description:
      "Generate professional tax-ready financial reports in one click. Perfect for tax season or personal reviews.",
  },
  {
    icon: Smartphone,
    title: "PWA — Install Anywhere",
    description:
      "No app store needed. Install SpendWise directly to your home screen for a native-app experience that works offline.",
  },
];

const bentoFeatures = [
  {
    icon: Tag,
    title: "Smart Tagging System",
    description:
      "Categorize every expense with custom labels — Needs, Wants, Investments — and drill down into subcategories for laser-focused clarity.",
    wide: true,
  },
  {
    icon: Zap,
    title: "Instant Insights",
    description:
      "Get a full forensic overview of your monthly finances in under 2 seconds with our AI engine.",
    wide: false,
    accent: true,
  },
];

const trustedBy = ["Fintech", "Students", "Freelancers", "Businesses", "Investors"];

/* ──────────────────────────────────────────────
   ANIMATION VARIANTS
 ────────────────────────────────────────────── */

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-secondary font-medium italic">"Exceptional tool for forensic financial tracking. Highly recommended!"</p>
        <p className="text-xs font-black uppercase tracking-widest mt-2 text-muted">— Early Adopter</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {reviews.slice(0, 6).map((review, i) => (
        <motion.div
          key={review.id}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-8 bg-surface border border-border-subtle rounded-[2rem] shadow-sm relative group hover:border-primary-500/30 transition-all"
        >
          <Quote className="absolute top-6 right-8 text-primary-500/10 group-hover:text-primary-500/20 transition-colors" size={48} />
          
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, starI) => (
              <Star 
                key={starI} 
                size={14} 
                className={starI < review.rating ? "fill-warning text-warning" : "text-border-subtle"} 
              />
            ))}
          </div>

          <p className="text-secondary font-medium leading-relaxed mb-6 italic relative z-10">
            "{review.comment}"
          </p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center shrink-0 border border-border-subtle">
              {review.user?.avatar ? (
                <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} className="text-muted" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{review.user?.name || "Anonymous User"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">SpendWise User</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   COMPONENT
 ────────────────────────────────────────────── */

export function HomeClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden pt-20" id="main-content">

        {/* ━━━━ HERO SECTION ━━━━ */}
        <section className="relative min-h-[92dvh] flex items-center py-24 px-5 md:px-10 overflow-hidden">
          {/* Background mesh */}
          <div className="absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(99,102,241,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(99,102,241,0.05) 0%, transparent 70%)"
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-14 lg:gap-20 items-center">

            {/* Left: copy */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="space-y-8 relative z-10 text-center lg:text-left"
            >
              {/* Version badge */}
              <motion.div
                variants={item}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mx-auto lg:mx-0"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.08)",
                  color: "#6366f1",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
                v2.0 — Forensic AI is Live
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={item}
                className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight text-foreground"
              >
                Your Money,{" "}
                <br />
                <span
                  className="italic"
                  style={{ color: "#6366f1" }}
                >
                  Forensically
                </span>
                <br />
                Analyzed.
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={item}
                className="text-lg md:text-xl text-secondary max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed"
              >
                AI-powered expense tracking with deep behavioral insights.
                Uncover the <em>&quot;why&quot;</em> behind your spending — with
                clinical precision.
              </motion.p>

              {/* CTA row */}
              <motion.div
                variants={item}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link
                  href="/login"
                  id="hero-get-started"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-base text-white shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                  style={{ background: "#6366f1" }}
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/how-it-works"
                  id="hero-see-how"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-base border border-border-subtle text-secondary hover:text-foreground hover:border-[#6366f1]/40 transition-all"
                >
                  See how it works →
                </Link>
              </motion.div>

              {/* Social proof micro stats */}
              <motion.div
                variants={item}
                className="flex items-center justify-center lg:justify-start gap-8 pt-4"
              >
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground">10K+</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Users Tracking</span>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground">₹2Cr+</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Tracked Monthly</span>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground">100%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Free Forever</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Forensic Dashboard Mockup */}
            <div className="relative w-full flex justify-center lg:justify-end">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ━━━━ TRUSTED BY STRIP ━━━━ */}
        {/* <section className="py-10 border-y border-border-subtle/50">
          <div className="max-w-5xl mx-auto px-5 md:px-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
              Trusted by 10,000+ users tracking their finances
            </span>
            <div className="flex items-center gap-8 flex-wrap justify-center">
              {trustedBy.map((brand) => (
                <span
                  key={brand}
                  className="text-[13px] font-black uppercase tracking-widest text-muted/60 hover:text-muted transition-colors"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section> */}

        {/* ━━━━ FEATURES GRID ━━━━ */}
        <section className="py-28 px-5 md:px-10">
          <div className="max-w-7xl mx-auto">

            {/* Section header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-6"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.07)",
                  color: "#6366f1",
                }}
              >
                <Activity size={12} /> Engineered for Transparency
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                Every Rupee. Every Reason.
              </h2>
              <p className="text-lg text-secondary font-medium max-w-xl mx-auto">
                Our toolkit gives you the microscopic detail you need to master your cash flow.
              </p>
            </motion.div>

            {/* 3×2 feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  className="group p-6 rounded-2xl border border-border-subtle bg-surface hover:border-primary-500/25 transition-all shadow-sm hover:shadow-lg"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      borderColor: "rgba(99,102,241,0.2)",
                      color: "#6366f1",
                    }}
                  >
                    <feat.icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-black text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-secondary font-medium leading-relaxed">{feat.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Link to full features */}
            <div className="mt-12 text-center">
              <Link
                href="/features"
                className="inline-flex items-center gap-2 text-base font-black hover:gap-4 transition-all"
                style={{ color: "#6366f1" }}
              >
                Explore all capabilities <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ━━━━ BENTO FEATURE HIGHLIGHTS ━━━━ */}
        <section className="py-20 px-5 md:px-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">

            {/* Wide card — Tagging */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="relative rounded-3xl overflow-hidden border border-border-subtle min-h-[340px] flex flex-col p-8 group"
              style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
              }}
            >
              {/* Visual mockup inside bento */}
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(99,102,241,0.25) 0%, transparent 70%)"
                }}
              />

              {/* Mock chart area */}
              <div className="flex-1 flex items-center justify-center mb-6 relative z-10">
                <div className="w-full max-w-xs">
                  <div className="flex items-end gap-3 h-28 px-4">
                    {[55, 80, 45, 95, 65, 75, 50, 85, 60, 90].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="flex-1 rounded-t-md"
                        style={{
                          background: i % 3 === 0
                            ? "rgba(99,102,241,0.6)"
                            : i % 3 === 1
                            ? "rgba(99,102,241,0.3)"
                            : "rgba(99,102,241,0.15)",
                        }}
                      />
                    ))}
                  </div>
                  {/* Fake labels */}
                  <div className="flex justify-between px-4 mt-2">
                    {["Needs", "Wants", "Invest"].map((l) => (
                      <span key={l} className="text-[9px] font-black text-muted uppercase tracking-widest">{l}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    borderColor: "rgba(99,102,241,0.2)",
                    color: "#6366f1",
                  }}
                >
                  <Tag size={20} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">
                  Granular Tagging Systems
                </h3>
                <p className="text-sm text-secondary font-medium leading-relaxed max-w-md">
                  Categorize every expense with custom forensic labels and multi-level tagging hierarchies.
                </p>
              </div>
            </motion.div>

            {/* Narrow accent card — Instant Insights */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.15 }}
              className="relative rounded-3xl overflow-hidden border min-h-[340px] flex flex-col p-8"
              style={{
                background: "linear-gradient(145deg, #6366f1 0%, #4f46e5 100%)",
                borderColor: "rgba(99,102,241,0.4)",
              }}
            >
              <div className="flex-1 flex items-center justify-center">
                {/* Animated pulse icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.15)" }}
                  >
                    <Zap size={36} className="text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-40" />
                  <div className="absolute inset-[-12px] rounded-full border border-white/15 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-white/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">AI Powered</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-3">
                  Instant Insight Generation
                </h3>
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  Get a forensic overview of your monthly health in under 2 seconds with our optimised edge engine.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━ TESTIMONIALS ━━━━ */}
        <section className="py-20 px-5 md:px-10 bg-surface-variant/30 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-warning/30 bg-warning/5 text-warning text-[11px] font-black tracking-widest uppercase mb-6">
                <Star size={12} className="fill-warning" /> Loved by the Community
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                What Our Users Say
              </h2>
            </motion.div>

            <TestimonialsSection />
          </div>
        </section>

        {/* ━━━━ FINAL CTA ━━━━ */}
        <section className="py-28 px-5 md:px-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
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
                <Zap size={12} /> Zero Cost, Maximum Clarity
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[0.95]">
                Your Wallet,{" "}
                <span className="italic" style={{ color: "#6366f1" }}>
                  Redefined.
                </span>
              </h2>

              <p className="text-lg text-secondary font-medium max-w-xl mx-auto mb-10">
                Join 10,000+ Indians taking full control of their financial destiny.
                Free forever. No credit card. No surprises.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  id="cta-start-free"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base transition-all hover:-translate-y-1 active:scale-95 shadow-xl text-white"
                  style={{ background: "#6366f1" }}
                >
                  Start Free Today
                  <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => window.dispatchEvent(new Event("showPwaInstall"))}
                  id="cta-install-app"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base border border-border-subtle text-secondary hover:text-foreground hover:border-primary-500/40 transition-all"
                >
                  <Download size={18} />
                  Install App
                </button>
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
