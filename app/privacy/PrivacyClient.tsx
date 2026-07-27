"use client";

import { motion, type Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Server,
  RefreshCw,
  Mail,
  UserCheck,
  Clock,
  AlertTriangle,
  Users,
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

const sections = [
  {
    icon: Shield,
    title: "Data Protection & Fiduciary",
    content:
      "Under the Digital Personal Data Protection (DPDP) Act 2023 of India, SpendWise acts as the Data Fiduciary. We take your data security seriously. All financial information is encrypted using industry-standard protocols, and we never store your Google account passwords — authentication is handled securely via OAuth 2.0.",
  },
  {
    icon: Eye,
    title: "Information Collection",
    content:
      "We only collect information necessary to provide our services. This includes your name, email address (via Google Auth), and the expense/income data you explicitly enter into the platform. We do not scrape, scan, or read your device's SMS, browser history, or local files.",
  },
  {
    icon: UserCheck,
    title: "Consent Management & Revocation",
    content:
      "Your consent is the sole legal basis for processing your data. Consent is explicit, specific, and clear. You have the right to withdraw your consent at any time. Revoking consent will lead to the immediate termination of your access and deletion of all associated personal and financial logs.",
  },
  {
    icon: Lock,
    title: "No Data Sharing",
    content:
      "SpendWise does not sell, trade, or transfer your personal information or financial logs to outside parties. Your data is your private property and is used solely for the purpose of providing you with automated visual financial insights.",
  },
  {
    icon: Server,
    title: "Secure Cloud Storage",
    content:
      "All data is hosted on secure, compliant cloud infrastructure with automated backups. We employ rigorous access controls and database encryption at rest to ensure your information remains accessible only to you.",
  },
  {
    icon: Clock,
    title: "Data Retention Period",
    content:
      "We retain your personal data only for as long as your account exists. If you initiate an account deletion request through your settings, all transactional data and profile identifiers are permanently erased from our active databases within 30 days.",
  },
  {
    icon: AlertTriangle,
    title: "Security Breach Notification",
    content:
      "In the unlikely event of a data breach, SpendWise is committed to identifying, mitigating, and reporting the incident. We will notify affected users and the Data Protection Board of India (DPBI) within 72 hours of confirmation.",
  },
  {
    icon: Users,
    title: "Children's Data Protection",
    content:
      "SpendWise does not knowingly collect, track, or process personal data from children under the age of 18. If we become aware that we have collected information from a child without parental consent, we will delete it immediately.",
  },
  {
    icon: Mail,
    title: "Grievance Officer Contact",
    content:
      "In compliance with the DPDP Act 2023, we have appointed a Grievance Officer to handle queries, concerns, or requests regarding data privacy. You may reach out directly:\n\n• Grievance Officer: Vinoth S\n• Contact Email: vinothg0618@gmail.com\n• Response Time: Within 15 business days.",
  },
  {
    icon: FileText,
    title: "Your Rights",
    content:
      "Under the DPDP Act 2023 and GDPR, you have the right to access a summary of your processed personal data, seek corrections or updates to incomplete profiles, request data erasure, and register complaints directly with the Grievance Officer or the DPBI.",
  },
  {
    icon: RefreshCw,
    title: "Policy Updates",
    content:
      "As regulations and our application features evolve, we may update this policy. We will notify you of any significant changes via email or an in-app announcement to ensure you remain fully informed of your data rights.",
  },
];

export default function PrivacyClient() {
  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden p-10 md:p-20" id="main-content">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative bg-surface-variant/40 py-5 md:py-10 px-5 md:px-10 ">
          <div className="max-w-6xl mx-auto text-center space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary"
            >
              <Shield size={12} className="text-primary-500" />
              Legal
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6"
            >
              Privacy <span className="text-primary-600">Policy.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] md:text-[17px] text-secondary max-w-xl mx-auto leading-relaxed"
            >
              Your trust is our most valuable asset. Here is how we protect your
              data and respect your privacy in accordance with the DPDP Act
              2023.
            </motion.p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ SECTIONS ═══════════ */}
        {sections.map((section, i) => (
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
                    <section.icon size={20} strokeWidth={2} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-[18px] md:text-[20px] font-bold text-foreground">
                      {i + 1}. {section.title}
                    </h2>
                    <p className="text-[15px] text-secondary leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
            {i < sections.length - 1 && <Separator />}
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
              We periodically update our privacy policy to reflect changes in
              our services and regulations. If you have any questions, please
              reach out to our Grievance Officer.
            </p>
          </div>
        </section>

        <Separator />

        {/* ═══════════ CTA ═══════════ */}
        <section className="bg-surface-variant/40 px-5 md:px-10 py-5 md:py-10">
          <div className="max-w-[600px] mx-auto text-center space-y-5">
            <h2 className="text-[28px] md:text-[36px] font-bold leading-[1.15] tracking-tight text-foreground">
              Questions about your{" "}
              <span className="text-primary-600">data?</span>
            </h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[460px] mx-auto">
              Our Grievance Officer is here to help. Reach out and we'll respond
              within 15 business days.
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
