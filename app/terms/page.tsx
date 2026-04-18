"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Scale, Coffee, CheckSquare, AlertCircle } from "lucide-react";

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
    icon: AlertCircle,
    title: "4. Limitation of Liability",
    content: "SpendWise is provided 'as is' without warranties of any kind. We are not responsible for any financial decisions made based on the insights provided by our platform."
  }
];

export default function TermsPage() {
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
              transition={{ delay: idx * 0.1 }}
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
      </main>
      <Footer />
    </>
  );
}
