"use client";

import { useState, useEffect, useMemo } from "react";
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
  Search,
  MessageCircle,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------
// Fallback FAQ data used when the API fails or returns no records
// ------------------------------------------------------------
const FALLBACK_FAQS: FAQItem[] = [
  { id: "1", question: "How do I create an account?", answer: "Click 'Sign Up' on the homepage and use Google Auth to create your account instantly.", category: "General", order: 1 },
  { id: "2", question: "Is my financial data secure?", answer: "All data is encrypted at rest and in transit using industry‑standard TLS.", category: "Security & Privacy", order: 2 },
  { id: "3", question: "Can I export my expense data?", answer: "Yes, go to Settings → Export and download a CSV of your records.", category: "Features & Support", order: 3 },
  { id: "4", question: "How does the AI analysis work?", answer: "Our AI scans your spending patterns and suggests optimizations without storing any personal data.", category: "Features & Support", order: 4 },
  { id: "5", question: "What if I forget my password?", answer: "We use Google OAuth, so you never set a password for SpendWise.", category: "General", order: 5 },
  { id: "6", question: "Do you share my data with third parties?", answer: "No. Your data never leaves your account unless you explicitly export it.", category: "Security & Privacy", order: 6 },
  { id: "7", question: "How can I contact support?", answer: "Use the 'Message Support' button at the bottom of the FAQ page or email support@spendwise.in.", category: "General", order: 7 },
  { id: "8", question: "Is there a free tier?", answer: "Yes, SpendWise offers a free plan with core features; premium features are available in paid plans.", category: "Features & Support", order: 8 },
];

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
    <motion.div 
      layout
      className={cn(
        "group border border-border-subtle rounded-3xl mb-4 transition-all duration-300",
        isOpen ? "bg-surface-variant/40 ring-1 ring-primary-500/10 shadow-sm" : "bg-surface hover:border-primary-500/30"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left transition-all"
      >
        <span className={cn(
          "text-lg font-bold transition-colors duration-300",
          isOpen ? "text-primary-600" : "text-foreground group-hover:text-primary-500"
        )}>
          {item.question}
        </span>
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
          isOpen ? "bg-primary-500 text-white rotate-180 shadow-lg shadow-primary-500/20" : "bg-surface-variant text-secondary group-hover:bg-primary-50 group-hover:text-primary-600"
        )}>
          <ChevronDown size={20} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 text-secondary leading-relaxed font-medium whitespace-pre-wrap text-[15px]">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/faq");
        const data = await res.json();
        setFaqs(data);
        // If API returned an empty array, fall back to static FAQs
        if (Array.isArray(data) && data.length === 0) {
          setFaqs(FALLBACK_FAQS);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs", error);
        // Use fallback FAQs so the page never stays empty
        setFaqs(FALLBACK_FAQS);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(faqs.map(f => f.category)))], [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  const categoryIcons: {[key: string]: any} = {
    "General": HelpCircle,
    "Security & Privacy": ShieldCheck,
    "Features & Support": Zap,
    "Payments": Zap,
    "All": Search
  };

  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 min-h-screen bg-background transition-colors duration-300">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full" />
        </div>

        {/* Hero Section */}
        <section className="px-5 md:px-10 max-w-5xl mx-auto mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/5 text-primary-600 text-[10px] font-black tracking-widest uppercase border border-primary-500/10 backdrop-blur-sm">
               Support Center
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tightest leading-[0.9]">
              How can we <br />
              <span className="text-primary-600">help you?</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              Everything you need to know about SpendWise, from getting started to advanced financial management.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-8">
              <div className="relative group">
                <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary-500" />
                <input 
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-surface border border-border-subtle focus:ring-4 focus:ring-primary-500/10 outline-none font-bold text-lg transition-all shadow-xl shadow-black/5 placeholder:text-muted/60"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Categories Section */}
        <section className="px-5 md:px-10 max-w-5xl mx-auto mb-12 overflow-x-auto scrollbar-no">
          <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3 pb-4">
            {categories.map((category) => {
              const Icon = category === "All" ? Search : (categoryIcons[category] || HelpCircle);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border flex items-center gap-2 whitespace-nowrap",
                    selectedCategory === category 
                      ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/20" 
                      : "bg-surface border-border-subtle text-secondary hover:border-primary-500/40 hover:text-foreground"
                  )}
                >
                  <Icon size={16} />
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQ List */}
        <section className="px-5 md:px-10 max-w-4xl mx-auto relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-24"
              >
                 <div className="w-16 h-16 bg-surface rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg border border-border-subtle">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                 </div>
                 <p className="font-black text-[11px] text-muted uppercase tracking-[0.2em]">Loading FAQs...</p>
              </motion.div>
            ) : filteredFaqs.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 p-12 bg-surface rounded-[3rem] border border-dashed border-border-subtle"
              >
                <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No matches found</h3>
                <p className="text-secondary font-medium">Try adjusting your search terms or category filter.</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {filteredFaqs.map((item) => (
                  <FAQAccordion key={item.id} item={item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Contact CTA Section */}
        <section className="mt-32 px-5 md:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Support Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group p-10 rounded-[2.5rem] bg-surface border border-border-subtle hover:border-primary-500/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-primary-600/5 group-hover:text-primary-600/10 transition-colors pointer-events-none">
                  <MessageCircle size={120} strokeWidth={1} />
                </div>
                <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-600 mb-8">
                  <MessageCircle size={28} />
                </div>
                <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Personalized <br />Support</h3>
                <p className="text-secondary font-medium mb-10 leading-relaxed max-w-xs">
                  Can't find what you're looking for? Our team is always here to help.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-primary-600 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Message Support <ArrowRight size={18} />
                </Link>
              </motion.div>

              {/* Community/Docs Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group p-10 rounded-[2.5rem] bg-surface-variant/40 border border-border-subtle hover:border-primary-500/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-foreground/5 group-hover:text-primary-600/10 transition-colors pointer-events-none">
                  <HelpCircle size={120} strokeWidth={1} />
                </div>
                <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-foreground mb-8 border border-border-subtle">
                  <HelpCircle size={28} />
                </div>
                <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Comprehensive <br />Docs</h3>
                <p className="text-secondary font-medium mb-10 leading-relaxed max-w-xs">
                  Dive deep into every feature with our detailed documentation and guides.
                </p>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 text-foreground font-black text-sm uppercase tracking-widest hover:gap-4 transition-all"
                >
                  View Documentation <ArrowUpRight size={18} />
                </Link>
              </motion.div>
            </div>

            {/* Download CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 p-12 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-center shadow-2xl shadow-primary-600/20"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to take control?</h2>
              <p className="text-primary-50 font-medium mb-10 max-w-lg mx-auto opacity-90">
                Join thousands of users who are already mastering their finances with SpendWise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/download"
                  className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white text-primary-600 font-black text-base shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download App
                </Link>
                <Link
                  href="/onboarding"
                  className="w-full sm:w-auto px-10 py-4 rounded-xl bg-primary-700/30 text-white border border-white/20 font-black text-base hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
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
