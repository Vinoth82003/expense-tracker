"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  FileText,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Doc } from "@/types/docs";
import { fadeUp } from "@/components/landing/sections/animations";
import { estimateReadingTime, extractExcerpt } from "@/lib/docs-utils";

interface Props {
  docs: Doc[];
}

function Separator() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="h-px w-full bg-border-subtle" />
    </div>
  );
}

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

  const stats = [
    { icon: FileText, label: "Articles", value: docs.length },
    { icon: Layers, label: "Categories", value: new Set(docs.map((d) => d.category)).size },
    { icon: Clock, label: "Min read", value: totalReadingTime },
  ];

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative py-20 md:py-26 px-5 md:px-10 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="max-w-[720px] mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
            <BookOpen size={12} className="text-primary-500" />
            Documentation
          </div>
          <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-bold leading-[1.15] tracking-tight text-foreground max-w-[600px] mx-auto mb-6">
            Learn SpendWise.{" "} <br />
            <span className="text-primary-600">Master your money.</span>
          </h1>
          <p className="text-[16px] text-secondary leading-relaxed max-w-[520px] mx-auto mb-10">
            Everything you need to get started, from your first expense to
            AI-powered forensic analysis and group splitting.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
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
          </div>
        </motion.div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-12 md:py-16 px-5 md:px-10 border-y border-border-subtle bg-surface">
        <div className="max-w-[1120px] mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                <stat.icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground leading-none mb-0.5">
                  {stat.value}
                </div>
                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Docs by Category ─── */}
      {searchQuery && filteredDocs.length === 0 ? (
        <section className="py-24 md:py-32 px-5 md:px-10">
          <div className="max-w-[720px] mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mx-auto text-muted">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground">
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
          </div>
        </section>
      ) : (
        categories.map((category, catIndex) => {
          const categoryDocs = filteredDocs.filter(
            (d) => d.category === category,
          );
          if (categoryDocs.length === 0) return null;

          const isEven = catIndex % 2 === 0;

          return (
            <div key={category}>
              {catIndex > 0 && <Separator />}
              <div className={isEven ? "" : "bg-surface-variant"}>
                <section className="py-24 md:py-32 px-5 md:px-10">
                  <div className="max-w-[1120px] mx-auto">
                    {/* Category Header */}
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-80px" }}
                      className="mb-14"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-surface text-[12px] font-semibold tracking-wider uppercase text-secondary mb-6">
                        <Layers size={12} className="text-primary-500" />
                        {category}
                      </div>
                      <h2 className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[1.15] tracking-tight text-foreground">
                        {category}
                      </h2>
                    </motion.div>

                    {/* Doc Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {categoryDocs.map((doc, i) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 24 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: 0.45,
                            delay: Math.min(i * 0.06, 0.3),
                            ease: "easeOut",
                          }}
                          whileHover={{ y: -4 }}
                        >
                          <Link
                            href={`/docs/${doc.slug}`}
                            className="group block h-full rounded-2xl border border-border-subtle bg-surface p-7 shadow-sm hover:shadow-lg hover:border-primary-500/20 transition-all"
                          >
                            <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 mb-5 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                              <BookOpen size={20} strokeWidth={2} />
                            </div>
                            <h3 className="text-[16px] font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors">
                              {doc.title}
                            </h3>
                            <p className="text-[13px] text-secondary font-medium leading-relaxed mb-5 line-clamp-2">
                              {extractExcerpt(doc.content, 120)}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  {estimateReadingTime(doc.content)} min
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border-subtle" />
                                <span>
                                  {doc.updatedAt
                                    ? new Date(
                                        doc.updatedAt,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : ""}
                                </span>
                              </div>
                              <ArrowRight
                                size={14}
                                className="text-primary-600 group-hover:translate-x-1 transition-transform"
                              />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
