"use client";

import { motion, type Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  Scale,
  Coffee,
  CheckSquare,
  AlertCircle,
  Activity,
  UserCheck,
  Shield,
  FileSpreadsheet,
  Ban,
  Gavel,
  Globe,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

const terms = [
  {
    icon: Scale,
    title: "Acceptance of Terms",
    content:
      "By accessing or using SpendWise, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the application.",
  },
  {
    icon: Coffee,
    title: "Personal Use",
    content:
      "SpendWise is provided for personal, non-commercial use. You are responsible for ensuring your data entry complies with local laws and regulations.",
  },
  {
    icon: CheckSquare,
    title: "User Responsibilities",
    content:
      "You are solely responsible for all activity that occurs under your account. You must maintain the security of your authentication sessions and notify us immediately of any security breaches.",
  },
  {
    icon: Activity,
    title: "Service Description",
    content:
      "SpendWise is a personal expense tracking and budgeting application. It utilizes local browser capabilities and third-party AI features to parse and analyze financial transactions you manually record.",
  },
  {
    icon: UserCheck,
    title: "Account & Authentication",
    content:
      "Authentication is handled securely via Google OAuth 2.0. SpendWise does not store or process passwords. You are responsible for maintaining the security of the Google Account used to access this service.",
  },
  {
    icon: Shield,
    title: "Intellectual Property",
    content:
      "All intellectual property rights associated with SpendWise, including code, design systems, layouts, brand logos, graphics, and text, remain the exclusive property of SpendWise and its creator, Vinoth S.",
  },
  {
    icon: Globe,
    title: "Third-Party Services",
    content:
      "SpendWise utilizes third-party infrastructure and AI APIs (including Google Accounts, Gemini AI, and Vercel Hosting). Your interactions with these integrations are subject to their respective terms.",
  },
  {
    icon: FileSpreadsheet,
    title: "Data Ownership & Portability",
    content:
      "You retain absolute ownership of all financial logs, categories, and budgets you input. You may export your entire transaction history to CSV format at any time using in-app settings.",
  },
  {
    icon: Ban,
    title: "Termination",
    content:
      "We reserve the right to restrict, suspend, or terminate your access to SpendWise at any time, with or without notice, for violating these terms or engaging in scraping, spamming, or abuse of service APIs.",
  },
  {
    icon: Gavel,
    title: "Dispute Resolution",
    content:
      "Any disputes arising from these Terms or the use of SpendWise will first be addressed through direct mediation. If unresolved, they shall be submitted to arbitration.",
  },
  {
    icon: TrendingUp,
    title: "Governing Law & Jurisdiction",
    content:
      "These Terms of Service are governed by and construed in accordance with the laws of India. Any legal action or proceeding shall be brought exclusively in the courts of Tamil Nadu, India.",
  },
  {
    icon: AlertCircle,
    title: "Limitation of Liability",
    content:
      "SpendWise is provided 'as is' without warranties of any kind. We are not liable for any financial decisions, investment outcomes, losses, or errors resulting from insights, charts, or AI recommendations.",
  },
];

export function TermsClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden p-10 md:p-20" id="main-content">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10">
          <div className="max-w-7xl mx-auto text-center space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary"
            >
              <Scale size={12} className="text-primary-500" />
              Legal
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6"
            >
              Terms of <span className="text-primary-600">Service.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed"
            >
              Please read these terms carefully before using SpendWise. They
              outline your rights and obligations as a user.
            </motion.p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ TERMS SECTIONS ═══════════ */}
        {terms.map((term, i) => (
          <section key={i}>
            <div
              className={`px-5 md:px-10 py-5 md:py-10 ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-variant/40"
              }`}
            >
              <div className="max-w-[800px] mx-auto">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="flex gap-6 items-start"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0 mt-1">
                    <term.icon size={20} strokeWidth={2} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-[18px] md:text-[20px] font-bold text-foreground">
                      {i + 1}. {term.title}
                    </h2>
                    <p className="text-[15px] text-secondary leading-relaxed">
                      {term.content}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
            {i < terms.length - 1 && <Separator />}
          </section>
        ))}

        <Separator />

        {/* ═══════════ LAST UPDATED ═══════════ */}
        <section className="bg-surface px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-4">
            <p className="text-[12px] font-semibold text-muted uppercase tracking-wider">
              Last Updated: June 2026
            </p>
            <p className="text-[15px] text-secondary leading-relaxed">
              By using SpendWise you acknowledge that you have read, understood,
              and agree to be bound by these Terms of Service.
            </p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ CTA ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-5">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Need <span className="text-primary-600">help?</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[460px] mx-auto">
              Our support team is here to answer any questions about these terms
              or your account.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Contact Us
              <ChevronRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
