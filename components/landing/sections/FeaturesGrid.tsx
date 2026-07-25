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
  RefreshCw,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Sage AI — Deep Insights",
    description:
      "Ask questions in plain language, get structured breakdowns of where your money goes. Detect leaks, spot anomalies, and receive saving strategies — all from your real transactions.",
    wide: true,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600",
    iconBorder: "border-purple-500/20",
  },
  {
    icon: IndianRupee,
    title: "Rupee-Ready Intelligence",
    description:
      "Built for India. ₹ formatting, UPI tracking, Lakhs/Crores support, and financial-year reporting from April to March.",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-600",
    iconBorder: "border-pink-500/20",
  },
  {
    icon: Target,
    title: "Smart Budgets",
    description:
      "Set monthly budgets that adapt to your lifestyle. Real-time alerts fire before you overspend — not after the damage is done.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    iconBorder: "border-blue-500/20",
  },
  {
    icon: RefreshCw,
    title: "Subscriptions & Bills",
    description:
      "Track recurring charges across Netflix, phone bills, rent, and SIPs. Know exactly what you are locked into every month.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    iconBorder: "border-amber-500/20",
  },
  {
    icon: FileText,
    title: "PDF Report Export",
    description:
      "Generate professional, tax-ready financial reports in one click. Perfect for CA handoffs or personal yearly reviews.",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    iconBorder: "border-emerald-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    description:
      "Google OAuth 2.0, encryption in transit and at rest, zero password storage. Your financial data stays entirely yours.",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    iconBorder: "border-red-500/20",
  },
];

export function FeaturesGrid() {
  return (
    <section className="px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1120px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="mb-16 text-center"
        >
          <h2 className="mx-auto mb-5 max-w-[700px] text-[28px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] lg:text-[44px]">
            Everything you need.{" "}
            <span className="text-primary-600">Nothing you don&apos;t.</span>
          </h2>

          <p className="mx-auto max-w-[500px] text-[15px] leading-relaxed text-secondary">
            Powerful features that make tracking every rupee feel effortless —
            not exhausting.
          </p>
        </motion.div>

        {/* ==========================================
            DESKTOP
            ========================================== */}

        <div className="hidden lg:block">
          {/* Row 1 */}
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-5">
            {features.slice(0, 1).map((feat, index) => (
              <FeatureCard
                key={feat.title}
                feat={feat}
                index={index}
                wide={index === 0}
              />
            ))}
          </div>

          {/* Row 2 */}
          <div className="mt-5 grid grid-cols-2 gap-5">
            {features.slice(2).map((feat, index) => (
              <FeatureCard key={feat.title} feat={feat} index={index + 3} />
            ))}
          </div>
        </div>

        {/* ==========================================
            TABLET
            ========================================== */}

        <div className="space-y-6 grid-cols-2 gap-5 md:grid lg:hidden">
          {features.map((feat, index) => (
            <FeatureCard key={feat.title} feat={feat} index={index} />
          ))}
        </div>

        {/* Explore */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
          className="mt-12 text-center"
        >
          <Link
            href="/features"
            aria-label="Explore all capabilities of SpendWise"
            className="group inline-flex items-center gap-2 text-[15px] font-bold text-primary-600 dark:text-primary-400"
          >
            Explore all capabilities
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  feat,
  index,
  wide = false,
}: {
  feat: (typeof features)[number];
  index: number;
  wide?: boolean;
}) {
  const Icon = feat.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.1,
      }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.06, 0.3),
        ease: "easeOut",
      }}
      whileHover={{
        y: -4,
      }}
      className={[
        "group relative rounded-2xl",
        "border border-border-subtle",
        "bg-surface",
        "p-4 md:p-6",
        "shadow-sm",
        "hover:border-primary-500/20",
        "hover:shadow-lg",
        wide ? "flex flex-col justify-between" : "",
      ].join(" ")}
    >
      <div>
        {/* Icon */}
        <div
          className={[
            "mb-5 flex h-11 w-11",
            "items-center justify-center",
            "rounded-xl border",
            feat.iconBg,
            feat.iconBorder,
            feat.iconColor,
          ].join(" ")}
        >
          <Icon size={20} strokeWidth={2} />
        </div>

        {/* Title */}
        <h3
          className={[
            "mb-2 font-bold text-foreground",
            wide ? "text-[17px]" : "text-[15px]",
          ].join(" ")}
        >
          {feat.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] font-medium leading-relaxed text-secondary">
          {feat.description}
        </p>
      </div>

      {/* Wide card footer */}
      {wide && (
        <div className="mt-5 flex items-center gap-2 border-t border-border-subtle pt-4">
          <Globe size={14} className="shrink-0 text-primary-500" />

          <span className="text-[12px] font-medium text-muted">
            Powered by Sage AI · Real-time analysis
          </span>
        </div>
      )}
    </motion.div>
  );
}
