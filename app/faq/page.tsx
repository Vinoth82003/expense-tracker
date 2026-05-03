"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  ChevronDown,
  Loader2,
  ArrowRight,
  Download,
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
        <section className="px-5 md:px-10 max-w-4xl mx-auto mb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black tracking-widest uppercase border border-primary-100">
               Knowledge Base
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tightest leading-[0.85]">
              Everything You <br />
              <span className="text-primary-600 italic">Need to Know.</span>
            </h1>
            <p className="text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
              Find answers to common questions about security, features, and how to master your personal finances with SpendWise.
            </p>
          </motion.div>
        </section>

        <section className="px-5 md:px-10 max-w-4xl mx-auto space-y-16">
          {loading ? (
            <div className="text-center py-24 animate-pulse">
               <div className="w-16 h-16 bg-surface-variant rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Loader2 className="animate-spin text-muted" size={32} />
               </div>
               <p className="font-black text-[10px] text-muted uppercase tracking-[0.2em]">Decrypting Records...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 p-10 bg-surface rounded-[3rem] border border-dashed border-border-subtle">
              <p className="font-bold text-secondary text-lg">No records found in this sector.</p>
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
                <div className="flex items-center gap-5 mb-10 pb-8 border-b border-border-subtle">
                  <div className="w-14 h-14 bg-primary-50 rounded-[1.2rem] flex items-center justify-center text-primary-600 shadow-sm">
                    {categoryIcons[category] ? React.createElement(categoryIcons[category], { size: 28, strokeWidth: 2.5 }) : <HelpCircle size={28} strokeWidth={2.5} />}
                  </div>
                  <h2 className="text-3xl font-black text-foreground tracking-tight">{category}</h2>
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

        <section className="py-28 px-5 md:px-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-80px" }}
              className="relative rounded-3xl overflow-hidden border border-border-subtle text-center p-12 md:p-20"
              style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-variant) 100%)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 blur-[100px] pointer-events-none -z-10"
                style={{ background: "rgba(99,102,241,0.1)" }}
              />

              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase mb-8"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.07)",
                  color: "#6366f1",
                }}
              >
                <HelpCircle size={12} /> Still have questions?
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[0.95]">
                Master Your Wealth <br />
                <span className="italic" style={{ color: "#6366f1" }}>
                  Without Confusion.
                </span>
              </h2>

              <p className="text-lg text-secondary font-medium max-w-xl mx-auto mb-10">
                Our support team is ready to help you with any technical or financial tracking issues. master your cash flow today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base transition-all hover:-translate-y-1 active:scale-95 shadow-xl text-white"
                  style={{ background: "#6366f1" }}
                >
                  Contact Support
                  <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => window.dispatchEvent(new Event('showPwaInstall'))}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-black text-base border border-border-subtle text-secondary hover:text-foreground hover:border-primary-500/40 transition-all"
                >
                  <Download size={18} />
                  Download App
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

import React from "react";
