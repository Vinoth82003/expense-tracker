"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
} from "lucide-react";

const sections = [
  {
    icon: Shield,
    title: "1. Data Protection & Fiduciary",
    content: "Under the Digital Personal Data Protection (DPDP) Act 2023 of India, SpendWise acts as the Data Fiduciary. We take your data security seriously. All financial information is encrypted using industry-standard protocols, and we never store your Google account passwords—authentication is handled securely via OAuth 2.0."
  },
  {
    icon: Eye,
    title: "2. Information Collection",
    content: "We only collect information necessary to provide our services. This includes your name, email address (via Google Auth), and the expense/income data you explicitly enter into the platform. We do not scrape, scan, or read your device's SMS, browser history, or local files."
  },
  {
    icon: UserCheck,
    title: "3. Consent Management & Revocation",
    content: "Your consent is the sole legal basis for processing your data. Consent is explicit, specific, and clear. You have the right to withdraw your consent at any time. Revoking consent will lead to the immediate termination of your access and deletion of all associated personal and financial logs."
  },
  {
    icon: Lock,
    title: "4. No Data Sharing",
    content: "SpendWise does not sell, trade, or transfer your personal information or financial logs to outside parties. Your data is your private property and is used solely for the purpose of providing you with automated visual financial insights."
  },
  {
    icon: Server,
    title: "5. Secure Cloud Storage",
    content: "All data is hosted on secure, compliant cloud infrastructure with automated backups. We employ rigorous access controls and database encryption at rest to ensure your information remains accessible only to you."
  },
  {
    icon: Clock,
    title: "6. Data Retention Period",
    content: "We retain your personal data only for as long as your account exists. If you initiate an account deletion request through your settings, all transactional data and profile identifiers are permanently erased from our active databases within 30 days."
  },
  {
    icon: AlertTriangle,
    title: "7. Security Breach Notification",
    content: "In the unlikely event of a data breach, SpendWise is committed to identifying, mitigating, and reporting the incident. We will notify affected users and the Data Protection Board of India (DPBI) within 72 hours of confirmation."
  },
  {
    icon: Users,
    title: "8. Children's Data Protection",
    content: "SpendWise does not knowingly collect, track, or process personal data from children under the age of 18. If we become aware that we have collected information from a child without parental consent, we will delete it immediately."
  },
  {
    icon: Mail,
    title: "9. Grievance Officer Contact",
    content: "In compliance with the DPDP Act 2023, we have appointed a Grievance Officer to handle queries, concerns, or requests regarding data privacy. You may reach out directly:\n• Grievance Officer: Vinoth S\n• Contact Email: vinothg0618@gmail.com\n• Response Time: Within 15 business days."
  },
  {
    icon: FileText,
    title: "10. Your Rights",
    content: "Under the DPDP Act 2023 and GDPR, you have the right to access a summary of your processed personal data, seek corrections or updates to incomplete profiles, request data erasure, and register complaints directly with the Grievance Officer or the DPBI."
  },
  {
    icon: RefreshCw,
    title: "11. Policy Updates",
    content: "As regulations and our application features evolve, we may update this policy. We will notify you of any significant changes via email or an in-app announcement to ensure you remain fully informed of your data rights."
  }
];

export default function PrivacyClient() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen">
        <section className="px-5 md:px-10 max-w-4xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter">
              Privacy <br />
              <span className="text-primary-600 italic">First.</span>
            </h1>
            <p className="text-xl text-secondary max-w-2xl mx-auto font-medium">
              Your trust is our most valuable asset. Here is how we protect your data and respect your privacy in accordance with the DPDP Act 2023.
            </p>
          </motion.div>
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto space-y-12">
          {sections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-8 md:p-12 rounded-[2.5rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 group-hover:scale-110 transition-transform">
                  <section.icon size={32} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{section.title}</h2>
                  <p className="text-lg text-secondary leading-relaxed font-medium whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 p-10 bg-surface-variant/50 rounded-[3.5rem] border border-dashed border-border-subtle text-center"
          >
            <h3 className="text-2xl font-black text-foreground mb-4">Last Updated: June 2026</h3>
            <p className="text-secondary font-medium">
              We periodically update our privacy policy to reflect changes in our services and regulations. 
              If you have any questions, please reach out to our Grievance Officer.
            </p>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
