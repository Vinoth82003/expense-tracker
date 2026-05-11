"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemedMarkdown } from "@/components/ui/ThemedMarkdown";
import { 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  Menu,
  Clock,
  ExternalLink,
  Info,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsTableOfContents } from "@/components/docs/DocsTableOfContents";
import { cn } from "@/lib/utils";

import { Doc } from "@/types/docs";

import Link from "next/link";

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null); // 'yes' or 'no'
  const [feedbackDone, setFeedbackDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/docs");
        const data = await res.json();
        setDocs(data);
        if (data.length > 0) setSelectedDoc(data[0]);
      } catch (error) {
        console.error("Failed to fetch docs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Scroll to top when selectedDoc changes
  useEffect(() => {
    if (selectedDoc) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedDoc]);

  const filteredDocs = useMemo(() => 
    docs.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    ), [docs, searchQuery]
  );

  // Navigation: Previous and Next docs
  const currentIndex = docs.findIndex(d => d.id === selectedDoc?.id);
  const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null;
  const nextDoc = currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

  return (
    <>
      <Navbar />
      
      {/* Sidebar Navigation */}
      <DocsSidebar 
        docs={filteredDocs}
        selectedDocId={selectedDoc?.id || null}
        onSelect={setSelectedDoc}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="min-h-screen pt-24 pb-20 transition-all flex justify-center">
        <div className="w-full max-w-[1440px] flex">
          {/* Spacer for fixed sidebar on desktop */}
          <div className="hidden lg:block w-80 shrink-0" />
        {/* Mobile Header Toggle */}
        <div className="lg:hidden sticky top-24 z-40 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-6 py-4 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary-600"
          >
            <Menu size={18} />
            <span>Documentation</span>
          </button>
          {selectedDoc && (
            <span className="text-[10px] font-bold text-muted truncate max-w-[150px] uppercase tracking-tighter">
              {selectedDoc.title}
            </span>
          )}
        </div>

        <div className="flex-1 max-w-4xl px-6 md:px-12 py-12">
          {loading ? (
            <div className="space-y-12 animate-pulse">
               <div className="space-y-4">
                 <div className="h-4 w-24 bg-surface-variant rounded-full" />
                 <div className="h-12 w-3/4 bg-surface-variant rounded-2xl" />
                 <div className="h-4 w-1/2 bg-surface-variant rounded-full" />
               </div>
               <div className="space-y-6">
                 {[1, 2, 3, 4].map(i => <div key={i} className="h-4 w-full bg-surface-variant rounded-full" />)}
               </div>
            </div>
          ) : selectedDoc ? (
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
                 <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tightest leading-[0.95]">
                   {selectedDoc.title}
                 </h1>
                 <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted">
                      <Clock size={14} />
                      <span>Last updated {new Date(selectedDoc.updatedAt || Date.now()).toLocaleDateString()}</span>
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
                  <button 
                    onClick={() => setSelectedDoc(prevDoc)}
                    className="w-full sm:w-auto p-6 rounded-[2rem] border border-border-subtle hover:border-primary-500/30 hover:bg-surface-variant transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                       <ArrowLeft size={12} /> Previous
                    </div>
                    <div className="font-black text-lg text-foreground group-hover:text-primary-600 transition-colors">{prevDoc.title}</div>
                  </button>
                ) : <div />}

                {nextDoc ? (
                  <button 
                    onClick={() => setSelectedDoc(nextDoc)}
                    className="w-full sm:w-auto p-6 rounded-[2rem] border border-border-subtle hover:border-primary-500/30 hover:bg-surface-variant transition-all text-right group"
                  >
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                       Next <ArrowRight size={12} />
                    </div>
                    <div className="font-black text-lg text-foreground group-hover:text-primary-600 transition-colors">{nextDoc.title}</div>
                  </button>
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
                              await fetch(`/api/docs/${selectedDoc.id}/feedback`, {
                                method: "POST",
                                body: JSON.stringify({ helpful: true })
                              });
                              setFeedbackDone(prev => ({ ...prev, [selectedDoc.id]: true }));
                              setFeedbackSubmitting(null);
                              toast.success("Thank you for your feedback!");
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
                              await fetch(`/api/docs/${selectedDoc.id}/feedback`, {
                                method: "POST",
                                body: JSON.stringify({ helpful: false })
                              });
                              setFeedbackDone(prev => ({ ...prev, [selectedDoc.id]: true }));
                              setFeedbackSubmitting(null);
                              toast.success("Thanks for letting us know! We'll work on it.");
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
          ) : (
            <div className="py-20 text-center space-y-4">
               <h3 className="text-2xl font-black">Document not found</h3>
               <p className="text-secondary">Please select another section from the sidebar.</p>
            </div>
          )}
        </div>
          {/* Spacer for fixed TOC on desktop */}
          <div className="hidden xl:block w-64 shrink-0" />
        </div>
      </main>

      {/* Table of Contents (Desktop only) */}
      {selectedDoc && (
        <DocsTableOfContents content={selectedDoc.content} />
      )}

      <Footer />
    </>
  );
}
