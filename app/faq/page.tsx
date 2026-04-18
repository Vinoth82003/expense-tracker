"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  ChevronDown,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

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
            <div className="pb-8 text-secondary leading-relaxed font-medium whitespace-pre-wrap">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/faq");
        const data = await res.json();
        setFaqs(data);
      } catch (error) {
        console.error("Failed to fetch FAQs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const categories = Array.from(new Set(faqs.map(f => f.category)));
  const categoryIcons: {[key: string]: any} = {
    "General": HelpCircle,
    "Security & Privacy": ShieldCheck,
    "Features & Support": Zap
  };

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
          {loading ? (
            <div className="text-center py-20 animate-pulse text-muted font-black tracking-widest uppercase">Fetching Knowledge Base...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 p-10 bg-surface rounded-[3rem] border border-dashed border-border-subtle">
              <p className="font-bold text-secondary">No FAQs available at the moment.</p>
            </div>
          ) : (
            categories.map((category, idx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-12 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border-subtle">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    {categoryIcons[category] ? React.createElement(categoryIcons[category], { size: 24 }) : <HelpCircle size={24} />}
                  </div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-widest">{category}</h2>
                </div>
                
                <div className="divide-y divide-border-subtle">
                  {faqs.filter(f => f.category === category).map((item, i) => (
                    <FAQAccordion key={i} item={item} />
                  ))}
                </div>
              </motion.div>
            ))
          )}
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

import React from "react";
