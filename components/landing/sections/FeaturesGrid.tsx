"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  IndianRupee,
  Target,
  ShieldCheck,
  FileText,
  Smartphone,
  Activity,
} from "lucide-react";
import { fadeUp } from "./animations";

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
      "Google OAuth 2.0 authentication, encryption in transit and at rest, and zero password storage. Your data stays yours.",
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

export function FeaturesGrid() {
  return (
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
            Our toolkit gives you the microscopic detail you need to master your
            cash flow.
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
              <h3 className="text-base font-black text-foreground mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-secondary font-medium leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Link to full features */}
        <div className="mt-12 text-center">
          <Link
            href="/features"
            aria-label="Explore all capabilities of SpendWise"
            className="inline-flex items-center gap-2 text-base font-black hover:gap-4 transition-all text-indigo-600 dark:text-indigo-400"
          >
            Explore all capabilities <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
