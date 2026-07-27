"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  ChevronDown,
  Search,
  ArrowRight,
  MessageCircle,
  ArrowUpRight,
  BookOpen,
  Check,
  SearchX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/landing/sections/animations";

export const FALLBACK_FAQS: FAQItem[] = [
  { id: "1", question: "How do I create an account?", answer: "Click 'Sign Up' on the homepage and use Google Auth to create your account instantly.", category: "General", order: 1 },
  { id: "2", question: "Is my financial data secure?", answer: "All data is encrypted in transit using industry-standard TLS. We use Google OAuth 2.0 for authentication, bcrypt password hashing for email accounts, and optional 2FA.", category: "Security & Privacy", order: 2 },
  { id: "3", question: "Can I export my expense data?", answer: "Yes. You can export all your expenses and income as a CSV file from the Settings page. The AI analysis report can also be downloaded as a PDF.", category: "Features & Support", order: 3 },
  { id: "4", question: "How does the AI analysis work?", answer: "SpendWise sends your expense history to Google Gemini, which generates a structured report covering spending patterns, budget advice, and actionable suggestions. Notes are sanitized before sending.", category: "Features & Support", order: 4 },
  { id: "5", question: "What if I forget my password?", answer: "Sign in with Google for instant access, or create an account with email and password. Optional 2FA is available for extra security.", category: "General", order: 5 },
  { id: "6", question: "Do you share my data with third parties?", answer: "No. Your data never leaves your account unless you explicitly export it. We never sell or share financial data with anyone.", category: "Security & Privacy", order: 6 },
  { id: "7", question: "How can I contact support?", answer: "Use the 'Message Support' button below or email our support team. We typically respond within 24 hours.", category: "General", order: 7 },
  { id: "8", question: "Is there a free tier?", answer: "Yes. SpendWise offers a free plan with core tracking, budgeting, and AI insights. No hidden fees, no credit card required to get started.", category: "Features & Support", order: 8 },
];

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export function FAQClient({ faqs }: { faqs: FAQItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(faqs.map((f) => f.category)))],
    [faqs]
  );

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  const categoryIcons: { [key: string]: React.ElementType } = {
    General: HelpCircle,
    "Security & Privacy": ShieldCheck,
    "Features & Support": Zap,
    Payments: Zap,
    All: Search,
  };

  const trustSignals = [
    "Instant search results",
    "Real-time filtering",
    "Always up to date",
  ];

  return (
    <>
      <Navbar />

      <main className="overflow-x-hidden" id="main-content">

        {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
        <section className="relative py-20 md:py-26 px-5 md:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            className="max-w-[720px] mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
              <HelpCircle size={12} className="text-primary-500" />
              Support Center
            </div>
            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
              How can we{" "}
              <span className="text-primary-600">help you?</span>
            </h1>
            <p className="text-[16px] text-secondary leading-relaxed max-w-[520px] mx-auto mb-10">
              Everything you need to know about SpendWise, from getting started
              to advanced features. Search or browse by category below.
            </p>

            {/* Google-style search */}
            <div className="max-w-[560px] mx-auto">
              <div className="relative group">
                <Search
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary-500"
                />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOpenIndex(null);
                  }}
                  className="w-full pl-14 pr-5 py-4 rounded-full bg-surface border border-border-subtle focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 outline-none font-semibold text-[15px] transition-all placeholder:text-muted/60"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {trustSignals.map((signal, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={14} className="text-success" strokeWidth={2.5} />
                  <span className="text-[12px] md:text-[13px] font-medium text-muted">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <Separator />

        {/* ═══════════════════════ CATEGORY FILTERS ═══════════════════════ */}
        <section className="py-16 px-5 md:px-10 bg-surface-variant">
          <div className="max-w-[720px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="text-center mb-10"
            >
              <p className="text-[14px] text-secondary font-medium">
                Browse by topic
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3"
            >
              {categories.map((category) => {
                const Icon =
                  category === "All"
                    ? Search
                    : categoryIcons[category] || HelpCircle;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setOpenIndex(null);
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full font-semibold text-[13px] transition-all duration-200 border flex items-center gap-2 whitespace-nowrap",
                      selectedCategory === category
                        ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/20"
                        : "bg-surface border-border-subtle text-secondary hover:border-primary-500/30 hover:text-foreground"
                    )}
                  >
                    <Icon size={14} />
                    {category}
                  </button>
                );
              })}
            </motion.div>
          </div>
        </section>

        <Separator />

        {/* ═══════════════════════ FAQ ACCORDION ═══════════════════════ */}
        <section className="py-24 md:py-32 px-5 md:px-10 bg-surface">
          <div className="max-w-[720px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {filteredFaqs.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20 px-8"
                  >
                    <div className="w-14 h-14 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-5 text-muted">
                      <SearchX size={24} />
                    </div>
                    <h3 className="text-[17px] font-bold text-foreground mb-2">
                      No matches found
                    </h3>
                    <p className="text-[14px] text-secondary font-medium">
                      Try adjusting your search or category filter.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {filteredFaqs.map((item, i) => {
                      const isOpen = openIndex === i;
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => setOpenIndex(isOpen ? null : i)}
                            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left min-h-[56px] hover:bg-surface-variant/40 transition-colors duration-150"
                          >
                            <span className="text-[14px] md:text-[15px] font-semibold text-foreground leading-snug">
                              {item.question}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="shrink-0"
                            >
                              <ChevronDown size={18} className="text-muted" />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key="answer"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.25,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="overflow-hidden"
                              >
                                <p className="px-6 py-6 text-[13px] md:text-[14px] text-secondary leading-relaxed">
                                  {item.answer}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <Separator />

        {/* ═══════════════════════ HELP CTA ═══════════════════════ */}
        <section className="py-24 md:py-32 px-5 md:px-10 bg-surface-variant">
          <div className="max-w-[1120px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
                <MessageCircle size={12} className="text-primary-500" />
                Still need help?
              </div>
              <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground">
                We&apos;re here{" "}
                <span className="text-primary-600">for you.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[960px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-lg hover:border-primary-500/20 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 mb-5">
                  <MessageCircle size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  Personalized Support
                </h3>
                <p className="text-[13px] text-secondary font-medium leading-relaxed mb-6">
                  Can&apos;t find what you&apos;re looking for? Our team
                  typically responds within 24 hours.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-primary-600 font-semibold text-[13px] hover:gap-3 transition-all"
                >
                  Message Support <ArrowRight size={14} />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: 0.06, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-lg hover:border-primary-500/20 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-5">
                  <BookOpen size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  Comprehensive Docs
                </h3>
                <p className="text-[13px] text-secondary font-medium leading-relaxed mb-6">
                  Step-by-step guides, tutorials, and deep dives into every
                  SpendWise feature.
                </p>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 text-foreground font-semibold text-[13px] group-hover:text-primary-600 hover:gap-3 transition-all"
                >
                  View Documentation <ArrowUpRight size={14} />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
        <section className="py-32 md:py-36 px-5 md:px-10 bg-surface">
          <div className="max-w-[640px] mx-auto text-center">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground mb-6"
            >
              Ready to take control of{" "}
              <span className="text-primary-600">your finances?</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="text-[15px] md:text-[16px] text-secondary leading-relaxed max-w-[460px] mx-auto mb-10"
            >
              Take control of your finances with AI-powered insights.
              Start free today — your future self will thank you.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="flex flex-col items-center gap-4 mb-8"
            >
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-primary-600 text-white text-[16px] font-bold shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[52px]"
              >
                Get Started Free
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                href="/login"
                className="text-[14px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Already have an account? Sign in{" "}
                <ArrowRight size={14} className="inline -translate-y-px" />
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              {["No credit card required", "Free forever tier", "Export your data anytime"].map((signal, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check size={14} className="text-success" strokeWidth={2.5} />
                  <span className="text-[12px] md:text-[13px] font-medium text-muted">
                    {signal}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}
