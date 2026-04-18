"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemedMarkdown } from "@/components/ui/ThemedMarkdown";
import { Search, ChevronRight, BookOpen } from "lucide-react";

interface Doc {
  id: string;
  title: string;
  category: string;
  content: string;
  slug: string;
  order: number;
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1 space-y-10">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search docs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-border-subtle focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-sm"
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-muted uppercase tracking-widest pl-4">Documentation</h3>
                <nav className="space-y-2">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-surface-variant rounded-xl animate-pulse" />)}
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="p-4 text-xs font-bold text-muted uppercase">No docs found</div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${selectedDoc?.id === doc.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'hover:bg-surface-variant text-secondary'}`}
                      >
                        {doc.title}
                        <ChevronRight size={14} className={`transition-transform ${selectedDoc?.id === doc.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                      </button>
                    ))
                  )}
                </nav>
              </div>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="w-full h-[600px] bg-surface border border-border-subtle rounded-[4rem] animate-pulse flex items-center justify-center">
                   <BookOpen size={48} className="text-muted opacity-20" />
                </div>
              ) : selectedDoc ? (
                <motion.div
                  key={selectedDoc.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 md:p-16 rounded-[4rem] bg-surface border border-border-subtle shadow-xl min-h-[600px]"
                >
                  <div className="mb-8 flex items-center gap-3">
                     <div className="px-3 py-1 bg-primary-100 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                       {selectedDoc.category}
                     </div>
                     <div className="w-1 h-1 rounded-full bg-border-subtle" />
                     <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                       Reference: /{selectedDoc.slug}
                     </span>
                  </div>
                  <ThemedMarkdown content={selectedDoc.content} />
                </motion.div>
              ) : (
                <div className="w-full h-[600px] bg-surface border border-border-subtle rounded-[4rem] flex flex-col items-center justify-center text-center p-10">
                   <BookOpen size={48} className="text-muted mb-4" />
                   <h3 className="text-xl font-black text-foreground mb-2">No Document Selected</h3>
                   <p className="text-secondary font-medium">Please select a section from the sidebar to view its documentation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
