"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Plus,
  Minus,
  HelpCircle,
  ShieldCheck,
  Zap,
  CreditCard,
  ChevronDown,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: any;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "General",
    icon: HelpCircle,
    items: [
      {
        question: "Is SpendWise free to use?",
        answer: "Yes, SpendWise is completely free for personal use. We believe everyone deserves access to high-quality financial tracking without paywalls or hidden subscriptions.",
      },
      {
        question: "How do I get started?",
        answer: "Simply sign in with your Google account. No complex registration or email verification required—you'll be tracking your first expense in under 30 seconds.",
      },
      {
        question: "Is it available as an app?",
        answer: "SpendWise is a Progressive Web App (PWA). You can install it on your mobile device directly from your browser, providing a native-app-like experience including offline access.",
      },
    ],
  },
  {
    title: "Security & Privacy",
    icon: ShieldCheck,
    items: [
      {
        question: "How secure is my financial data?",
        answer: "Extremely. We use industry-standard encryption and secure OAuth 2.0 via Google. We never see or store your passwords, and your data is stored behind multiple layers of security.",
      },
      {
        question: "Do you sell my data?",
        answer: "Absolutely not. Your financial data is private and solely for your benefit. We do not sell your information to advertisers or third-party institutions.",
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, you have full control over your data. You can delete your account and all associated transactions at any time from your profile settings.",
      },
    ],
  },
  {
    title: "Features & Support",
    icon: Zap,
    items: [
      {
        question: "What is AI Forensic Analysis?",
        answer: "Our proprietary AI analyzes your spending patterns to find 'leaks' (wasteful spending) and provides data-driven advice to help you reach your goals faster.",
      },
      {
        question: "What currencies are supported?",
        answer: "SpendWise primarily supports the Indian Rupee (₹), but we also support multi-currency entry for travelers, with automatic conversion based on real-time rates.",
      },
      {
        question: "Can I export my data?",
        answer: "Yes, you can export your entire transaction history to CSV format at any time for tax purposes or personal records.",
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border-subtle last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-primary-600' : 'text-foreground'}`}>
          {item.question}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-primary-500 text-white rotate-180' : 'bg-surface-variant text-secondary'}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-8 text-secondary leading-relaxed font-medium">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
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
              Everything you <br />
              <span className="text-primary-600 italic">need to know.</span>
            </h1>
            <p className="text-xl text-secondary max-w-2xl mx-auto font-medium">
              Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
            </p>
          </motion.div>
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto space-y-16">
          {faqCategories.map((category, idx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-12 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border-subtle">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                  <category.icon size={24} />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-widest">{category.title}</h2>
              </div>
              
              <div className="divide-y divide-border-subtle">
                {category.items.map((item, i) => (
                  <FAQAccordion key={i} item={item} />
                ))}
              </div>
            </motion.div>
          ))}
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto mt-24 text-center">
          <div className="p-10 bg-surface-variant/50 rounded-[3rem] border border-dashed border-border-subtle">
            <h3 className="text-2xl font-black text-foreground mb-4">Still have questions?</h3>
            <p className="text-secondary font-medium mb-8">Our team is here to help you with any issues or feedback.</p>
            <motion.a
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               href="/contact"
               className="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-600/20"
            >
              Contact Support
              <ChevronDown size={18} className="-rotate-90" />
            </motion.a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
