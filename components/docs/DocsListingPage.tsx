"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Doc } from "@/types/docs";
import { cn } from "@/lib/utils";
import { estimateReadingTime, extractExcerpt } from "@/lib/docs-utils";

interface Props {
  docs: Doc[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
} as const;

export function DocsListingPage({ docs }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = useMemo(
    () =>
      docs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.content.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [docs, searchQuery],
  );

  const categories = useMemo(
    () => Array.from(new Set(filteredDocs.map((d) => d.category))),
    [filteredDocs],
  );

  const totalReadingTime = useMemo(
    () => docs.reduce((acc, d) => acc + estimateReadingTime(d.content), 0),
    [docs],
  );

  const containerClasses =
    "w-full px-5 sm:px-8 lg:px-12";

  return (
    <div className="min-w-0">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.04),transparent_50%)]" />
        <div className={cn(containerClasses, "relative py-16 sm:py-24")}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="mb-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-primary-600">
              <Sparkles size={14} />
              <span>Knowledge Base</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tightest leading-[0.9] mb-6">
              Documentation
            </h1>
            <p className="text-lg sm:text-xl text-secondary font-medium leading-relaxed max-w-2xl mb-8">
              Everything you need to master SpendWise — from getting started to
              advanced features, budgeting, and AI-powered insights.
            </p>

            {/* Search */}
            <div className="relative max-w-xl">
              <Search
                size={18}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-surface border border-border-subtle focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-[15px] transition-all placeholder:text-muted shadow-sm"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-variant border border-border-subtle text-[9px] text-muted font-black uppercase tracking-wider">
                <span>⌘</span>K
              </kbd>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-wrap items-center gap-6 sm:gap-10"
          >
            {[
              { icon: FileText, label: "Articles", value: docs.length },
              { icon: Layers, label: "Categories", value: new Set(docs.map((d) => d.category)).size },
              { icon: Clock, label: "Min read", value: totalReadingTime },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0">
                  <stat.icon size={18} />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground leading-none mb-0.5">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Categories & Docs Grid ─── */}
      <section className={cn(containerClasses, "py-16 sm:py-20")}>
        {searchQuery && filteredDocs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mx-auto text-muted">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-black text-foreground">
              No results found
            </h3>
            <p className="text-secondary font-medium max-w-md mx-auto">
              Try searching for a different term, or browse all{" "}
              <button
                onClick={() => setSearchQuery("")}
                className="text-primary-600 underline underline-offset-2 hover:no-underline"
              >
                documentation
              </button>
              .
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-16"
          >
            {categories.map((category) => {
              const categoryDocs = filteredDocs.filter(
                (d) => d.category === category,
              );
              if (categoryDocs.length === 0) return null;

              return (
                <motion.div key={category} variants={item}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0">
                      <Layers size={16} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {category}
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryDocs.map((doc) => (
                      <Link
                        key={doc.id}
                        href={`/docs/${doc.slug}`}
                        className="group relative flex flex-col p-6 sm:p-7 rounded-2xl border border-border-subtle bg-surface hover:border-primary-500/20 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                            <BookOpen size={17} />
                          </div>
                          <ArrowUpRight
                            size={16}
                            className="text-muted group-hover:text-primary-500 transition-all duration-300 -translate-y-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0"
                          />
                        </div>
                        <h3 className="font-black text-foreground text-base mb-2 group-hover:text-primary-600 transition-colors">
                          {doc.title}
                        </h3>
                        <p className="text-[13px] text-secondary font-medium leading-relaxed mb-4 line-clamp-2">
                          {extractExcerpt(doc.content, 120)}
                        </p>
                        <div className="mt-auto flex items-center gap-3 text-[11px] font-bold text-muted">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {estimateReadingTime(doc.content)} min
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border-subtle" />
                          <span>
                            {doc.updatedAt
                              ? new Date(doc.updatedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
