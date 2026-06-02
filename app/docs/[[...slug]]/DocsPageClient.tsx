"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemedMarkdown } from "@/components/ui/ThemedMarkdown";
import { 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Loader2 
} from "lucide-react";
import toast from "react-hot-toast";
import { DocsTableOfContents } from "@/components/docs/DocsTableOfContents";
import { Doc } from "@/types/docs";
import Link from "next/link";

interface DocsPageClientProps {
  selectedDoc: Doc | null;
  allDocs: Doc[];
}

export function DocsPageClient({ selectedDoc, allDocs }: DocsPageClientProps) {
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null); // 'yes' or 'no'
  const [feedbackDone, setFeedbackDone] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to top when selectedDoc changes (i.e. on route navigation)
  useEffect(() => {
    if (selectedDoc) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedDoc]);

  // Navigation: Previous and Next docs
  const currentIndex = selectedDoc ? allDocs.findIndex(d => d.id === selectedDoc.id) : -1;
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex > -1 && currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  if (!selectedDoc) {
    return (
      <div className="flex-1 max-w-4xl px-6 md:px-12 py-12">
        <div className="py-20 text-center space-y-4">
          <h3 className="text-2xl font-black">Document not found</h3>
          <p className="text-secondary">Please select another section from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col xl:flex-row min-w-0">
        <div className="flex-1 max-w-4xl px-6 md:px-12 py-12 min-w-0">
          <motion.article
            key={selectedDoc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
              <span className="hover:text-primary-500 cursor-pointer transition-colors">Docs</span>
              <ChevronRight size={10} />
              <span className="text-secondary">{selectedDoc.category}</span>
            </nav>

            {/* Page Header */}
            <header className="space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tightest leading-[0.95] break-words">
                {selectedDoc.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted">
                  <Clock size={14} />
                  <span>Last updated {mounted ? new Date(selectedDoc.updatedAt || Date.now()).toLocaleDateString() : ""}</span>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <div className="min-h-[400px]">
              {selectedDoc.contentType === "MARKDOWN" ? (
                <ThemedMarkdown content={selectedDoc.content} />
              ) : (
                <div 
                  className="prose-none animate-in fade-in duration-700" 
                  dangerouslySetInnerHTML={{ __html: selectedDoc.content }} 
                />
              )}
            </div>

            {/* Next/Previous Navigation */}
            <div className="pt-16 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
              {prevDoc ? (
                <Link 
                  href={`/docs/${prevDoc.slug}`}
                  className="w-full sm:w-auto p-6 rounded-[2rem] border border-border-subtle hover:border-primary-500/30 hover:bg-surface-variant transition-all text-left group"
                >
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                    <ArrowLeft size={12} /> Previous
                  </div>
                  <div className="font-black text-lg text-foreground group-hover:text-primary-600 transition-colors">{prevDoc.title}</div>
                </Link>
              ) : <div />}

              {nextDoc ? (
                <Link 
                  href={`/docs/${nextDoc.slug}`}
                  className="w-full sm:w-auto p-6 rounded-[2rem] border border-border-subtle hover:border-primary-500/30 hover:bg-surface-variant transition-all text-right group"
                >
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                    Next <ArrowRight size={12} />
                  </div>
                  <div className="font-black text-lg text-foreground group-hover:text-primary-600 transition-colors">{nextDoc.title}</div>
                </Link>
              ) : <div />}
            </div>

            {/* Feedback Section */}
            <div className="mt-20 p-10 rounded-[3rem] bg-surface-variant border border-border-subtle text-center space-y-6">
              <AnimatePresence mode="wait">
                {!feedbackDone[selectedDoc.id] ? (
                  <motion.div
                    key="feedback-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-xl font-black text-foreground">Was this page helpful?</h4>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button 
                        disabled={!!feedbackSubmitting}
                        onClick={async () => {
                          setFeedbackSubmitting('yes');
                          try {
                            await fetch(`/api/docs/${selectedDoc.id}/feedback`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ helpful: true })
                            });
                            setFeedbackDone(prev => ({ ...prev, [selectedDoc.id]: true }));
                            toast.success("Thank you for your feedback!");
                          } catch (error) {
                            console.error(error);
                          } finally {
                            setFeedbackSubmitting(null);
                          }
                        }}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-surface border border-border-subtle font-bold text-sm hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {feedbackSubmitting === 'yes' && <Loader2 size={16} className="animate-spin" />}
                        Yes, absolutely
                      </button>
                      <button 
                        disabled={!!feedbackSubmitting}
                        onClick={async () => {
                          setFeedbackSubmitting('no');
                          try {
                            await fetch(`/api/docs/${selectedDoc.id}/feedback`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ helpful: false })
                            });
                            setFeedbackDone(prev => ({ ...prev, [selectedDoc.id]: true }));
                            toast.success("Thanks for letting us know! We'll work on it.");
                          } catch (error) {
                            console.error(error);
                          } finally {
                            setFeedbackSubmitting(null);
                          }
                        }}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-surface border border-border-subtle font-bold text-sm hover:border-red-500 hover:text-red-600 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {feedbackSubmitting === 'no' && <Loader2 size={16} className="animate-spin" />}
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
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                        <ChevronRight size={24} className="rotate-90" />
                      </motion.div>
                    </div>
                    <h4 className="text-xl font-black text-foreground mb-2">Feedback Received!</h4>
                    <p className="text-sm text-muted font-medium italic">We appreciate your help in making our docs better.</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-xs text-muted font-medium pt-4">
                Still need help? <Link href="/contact" className="text-primary-600 font-bold hover:underline">Contact Support</Link>
              </p>
            </div>
          </motion.article>
        </div>

        {/* Spacer for fixed TOC on desktop */}
        <div className="hidden xl:block w-64 shrink-0" />
      </div>

      {/* Table of Contents (Desktop only) */}
      <DocsTableOfContents content={selectedDoc.content} />
    </>
  );
}
