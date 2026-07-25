"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemedMarkdown } from "@/components/ui/ThemedMarkdown";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Home,
  Tag,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { DocsTableOfContents } from "@/components/docs/DocsTableOfContents";
import { Doc } from "@/types/docs";
import Link from "next/link";
import { estimateReadingTime, formatDate } from "@/lib/docs-utils";

interface DocsPageClientProps {
  selectedDoc: Doc | null;
  allDocs: Doc[];
}

export function DocsPageClient({ selectedDoc, allDocs }: DocsPageClientProps) {
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);
  const [feedbackDone, setFeedbackDone] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedDoc) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedDoc]);

  const currentIndex = selectedDoc
    ? allDocs.findIndex((d) => d.id === selectedDoc.id)
    : -1;
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc =
    currentIndex > -1 && currentIndex < allDocs.length - 1
      ? allDocs[currentIndex + 1]
      : null;

  if (!selectedDoc) {
    return (
      <div className="flex-1 max-w-4xl px-6 md:px-12 py-12">
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mx-auto text-muted">
            <BookOpen size={28} />
          </div>
          <h3 className="text-2xl font-bold">Document not found</h3>
          <p className="text-secondary font-medium">
            Please select another section from the sidebar.
          </p>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-2xl bg-primary-500/10 text-primary-600 font-bold text-sm hover:bg-primary-500/20 transition-colors"
          >
            <Home size={15} />
            Browse all docs
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = estimateReadingTime(selectedDoc.content);

  return (
    <>
      <div className="flex flex-col xl:flex-row min-w-0">
        <div className="flex-1 max-w-4xl px-5 sm:px-10 md:px-14 py-10 sm:py-12 min-w-0">
          <motion.article
            key={selectedDoc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            {/* ─── Breadcrumbs ─── */}
            <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <Link
                href="/docs"
                className="hover:text-primary-600 transition-colors"
              >
                Docs
              </Link>
              <ChevronRight size={10} />
              <span className="text-secondary">{selectedDoc.category}</span>
              <ChevronRight size={10} />
              <span className="text-foreground truncate max-w-[200px]">
                {selectedDoc.title}
              </span>
            </nav>

            {/* ─── Page Header ─── */}
            <header className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border-subtle bg-surface text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <Tag size={11} />
                  {selectedDoc.category}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight break-words">
                {selectedDoc.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted">
                <span className="flex items-center gap-2">
                  <Clock size={14} />
                  {readingTime} min read
                </span>
                <span className="w-1 h-1 rounded-full bg-border-subtle" />
                <span>
                  Updated{" "}
                  {mounted
                    ? formatDate(selectedDoc.updatedAt || selectedDoc.createdAt)
                    : ""}
                </span>
              </div>
            </header>

            {/* ─── Divider ─── */}
            <hr className="h-px bg-border-subtle" />

            {/* ─── Main Content ─── */}
            <div className="min-h-[400px]">
              {selectedDoc.contentType === "MARKDOWN" ? (
                <ThemedMarkdown content={selectedDoc.content} />
              ) : (
                <div
                  className="prose prose-indigo dark:prose-invert max-w-none prose-headings:font-bold prose-headings:scroll-mt-24 prose-p:text-secondary prose-p:font-medium prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-bold prose-code:bg-surface-variant prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:font-bold prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-variant prose-pre:border prose-pre:border-border-subtle prose-pre:rounded-2xl prose-pre:p-6 prose-pre:shadow-sm prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-a:font-bold prose-img:rounded-2xl prose-img:shadow-xl prose-li:font-medium prose-li:text-secondary animate-in fade-in duration-700"
                  dangerouslySetInnerHTML={{ __html: selectedDoc.content }}
                />
              )}
            </div>

            {/* ─── Divider ─── */}
            <hr className="h-px bg-border-subtle" />

            {/* ─── Next / Previous Navigation ─── */}
            <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4">
              {prevDoc ? (
                <Link
                  href={`/docs/${prevDoc.slug}`}
                  className="group flex-1 p-6 rounded-2xl border border-border-subtle bg-surface hover:border-primary-500/20 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
                    <ArrowLeft size={12} /> Previous
                  </div>
                  <div className="font-bold text-base text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">
                    {prevDoc.title}
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextDoc ? (
                <Link
                  href={`/docs/${nextDoc.slug}`}
                  className="group flex-1 p-6 rounded-2xl border border-border-subtle bg-surface hover:border-primary-500/20 hover:shadow-md transition-all text-right"
                >
                  <div className="flex items-center justify-end gap-2 text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
                    Next <ArrowRight size={12} />
                  </div>
                  <div className="font-bold text-base text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">
                    {nextDoc.title}
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>

            {/* ─── Feedback Section ─── */}
            <div className="p-8 sm:p-10 rounded-2xl bg-surface-variant border border-border-subtle text-center space-y-6">
              <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto">
                <MessageCircle size={22} />
              </div>
              <AnimatePresence mode="wait">
                {!feedbackDone[selectedDoc.id] ? (
                  <motion.div
                    key="feedback-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-xl font-bold text-foreground">
                      Was this page helpful?
                    </h4>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        disabled={!!feedbackSubmitting}
                        onClick={async () => {
                          setFeedbackSubmitting("yes");
                          try {
                            await fetch(`/api/docs/${selectedDoc.id}/feedback`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ helpful: true }),
                            });
                            setFeedbackDone((prev) => ({
                              ...prev,
                              [selectedDoc.id]: true,
                            }));
                            toast.success("Thank you for your feedback!");
                          } catch {
                            // silently fail
                          } finally {
                            setFeedbackSubmitting(null);
                          }
                        }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-surface border border-border-subtle font-bold text-sm hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2.5 disabled:opacity-50"
                      >
                        {feedbackSubmitting === "yes" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ThumbsUp size={16} />
                        )}
                        Yes, absolutely
                      </button>
                      <button
                        disabled={!!feedbackSubmitting}
                        onClick={async () => {
                          setFeedbackSubmitting("no");
                          try {
                            await fetch(`/api/docs/${selectedDoc.id}/feedback`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ helpful: false }),
                            });
                            setFeedbackDone((prev) => ({
                              ...prev,
                              [selectedDoc.id]: true,
                            }));
                            toast.success("Thanks for letting us know! We'll work on it.");
                          } catch {
                            // silently fail
                          } finally {
                            setFeedbackSubmitting(null);
                          }
                        }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-surface border border-border-subtle font-bold text-sm hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600 transition-all shadow-sm flex items-center justify-center gap-2.5 disabled:opacity-50"
                      >
                        {feedbackSubmitting === "no" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ThumbsDown size={16} />
                        )}
                        Not really
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="feedback-thanks"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-4"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      >
                        <ThumbsUp size={24} />
                      </motion.div>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-2">
                      Feedback Received!
                    </h4>
                    <p className="text-sm text-muted font-medium">
                      We appreciate your help in making our docs better.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-muted font-medium pt-2">
                Still need help?{" "}
                <Link
                  href="/contact"
                  className="text-primary-600 font-bold hover:underline"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </motion.article>
        </div>

        {/* Spacer for fixed TOC on desktop */}
        <div className="hidden xl:block w-64 shrink-0" />
      </div>

      <DocsTableOfContents content={selectedDoc.content} />
    </>
  );
}
