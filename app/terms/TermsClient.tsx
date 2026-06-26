"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
} from "lucide-react";

const terms = [
  {
    icon: Scale,
    title: "1. Acceptance of Terms",
    content: "By accessing or using SpendWise, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the application."
  },
  {
    icon: Coffee,
    title: "2. Personal Use",
    content: "SpendWise is provided for personal, non-commercial use. You are responsible for ensuring your data entry complies with local laws and regulations."
  },
  {
    icon: CheckSquare,
    title: "3. User Responsibilities",
    content: "You are solely responsible for all activity that occurs under your account. You must maintain the security of your authentication sessions and notify us immediately of any security breaches."
  },
  {
    icon: Activity,
    title: "4. Service Description",
    content: "SpendWise is a personal expense tracking and budgeting application. It utilizes local browser capabilities and third-party AI features to parse and analyze financial transactions you manually record."
  },
  {
    icon: UserCheck,
    title: "5. Account & Authentication",
    content: "Authentication is handled securely via Google OAuth 2.0. SpendWise does not store or process passwords. You are responsible for maintaining the security of the Google Account used to access this service."
  },
  {
    icon: Shield,
    title: "6. Intellectual Property",
    content: "All intellectual property rights associated with SpendWise, including code, design systems, layouts, brand logos, graphics, and text, remain the exclusive property of SpendWise and its creator, Vinoth S."
  },
  {
    icon: Globe,
    title: "7. Third-Party Services",
    content: "SpendWise utilizes third-party infrastructure and AI APIs (including Google Accounts, Gemini AI, and Vercel Hosting). Your interactions with these integrations are subject to their respective terms."
  },
  {
    icon: FileSpreadsheet,
    title: "8. Data Ownership & Portability",
    content: "You retain absolute ownership of all financial logs, categories, and budgets you input. You may export your entire transaction history to CSV format at any time using in-app settings."
  },
  {
    icon: Ban,
    title: "9. Termination",
    content: "We reserve the right to restrict, suspend, or terminate your access to SpendWise at any time, with or without notice, for violating these terms or engaging in scraping, spamming, or abuse of service APIs."
  },
  {
    icon: Gavel,
    title: "10. Dispute Resolution",
    content: "Any disputes arising from these Terms or the use of SpendWise will first be addressed through direct mediation. If unresolved, they shall be submitted to arbitration."
  },
  {
    icon: TrendingUp,
    title: "11. Governing Law & Jurisdiction",
    content: "These Terms of Service are governed by and construed in accordance with the laws of India. Any legal action or proceeding shall be brought exclusively in the courts of Tamil Nadu, India."
  },
  {
    icon: AlertCircle,
    title: "12. Limitation of Liability",
    content: "SpendWise is provided 'as is' without warranties of any kind. We are not liable for any financial decisions, investment outcomes, losses, or errors resulting from insights, charts, or AI recommendations."
  }
];

export function TermsClient() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen">
        <section className="px-5 md:px-10 max-w-4xl mx-auto mb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none">
              Terms of <br />
              <span className="text-primary-600 italic">Service.</span>
            </h1>
            <p className="text-xl text-secondary max-w-2xl mx-auto font-medium">
              Please read these terms carefully before using SpendWise. They outline your rights and obligations as a user.
            </p>
          </motion.div>
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto divide-y divide-border-subtle">
          {terms.map((term, idx) => (
            <motion.div
              key={term.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="py-12 flex flex-col md:flex-row gap-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center text-secondary shrink-0">
                <term.icon size={24} />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-foreground tracking-tight">{term.title}</h2>
                <p className="text-lg text-secondary leading-relaxed font-medium">
                  {term.content}
                </p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Legal compliance footer */}
        <div className="max-w-3xl mx-auto px-5 md:px-10 pb-16 text-center">
          <p className="text-xs text-muted font-semibold uppercase tracking-widest border-t border-border-subtle pt-8">
            Last Updated: June 2026
          </p>
          <p className="text-xs text-muted font-medium mt-2">
            By using SpendWise you acknowledge that you have read, understood,
            and agree to be bound by these Terms of Service.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
