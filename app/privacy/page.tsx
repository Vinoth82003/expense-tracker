"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Lock, Eye, FileText, ChevronRight } from "lucide-react";

const sections = [
  {
    icon: Shield,
    title: "Data Protection",
    content: "We take your data security seriously. All financial information is encrypted using industry-standard protocols. We never store your Google account passwords—authentication is handled securely via OAuth 2.0."
  },
  {
    icon: Eye,
    title: "Information Collection",
    content: "We only collect information necessary to provide our services. This includes your name, email address (via Google Auth), and the expense/income data you explicitly enter into the platform."
  },
  {
    icon: Lock,
    title: "Data Sharing",
    content: "SpendWise does not sell, trade, or otherwise transfer your personal information to outside parties. Your data is your private property and is used solely for the purpose of providing you with financial insights."
  },
  {
    icon: FileText,
    title: "Your Rights",
    content: "You have the right to access, export, or delete your entire data history at any time. We provide self-service tools within your profile settings to manage your data privacy."
  }
];

export default function PrivacyPage() {
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
              Your trust is our most valuable asset. Here is how we protect your data and respect your privacy.
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
              transition={{ delay: idx * 0.1 }}
              className="p-8 md:p-12 rounded-[2.5rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 group-hover:scale-110 transition-transform">
                  <section.icon size={32} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{section.title}</h2>
                  <p className="text-lg text-secondary leading-relaxed font-medium">
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
            <h3 className="text-2xl font-black text-foreground mb-4">Last Updated: April 2026</h3>
            <p className="text-secondary font-medium">
              We periodically update our privacy policy to reflect changes in our services and regulations. 
              If you have any questions, please reach out to our support team.
            </p>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
