"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { Menu } from "lucide-react";
import { Doc } from "@/types/docs";
import { usePathname } from "next/navigation";

export function DocsLayoutClient({ children, docs }: { children: React.ReactNode; docs: Doc[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Find which doc is currently active in the sidebar based on URL path
  const selectedDocId = useMemo(() => {
    // Extract the slug from the path, e.g., /docs/intro -> intro
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[1]; // docs is parts[0], slug is parts[1]
    
    if (!slug) {
      // If we are just on /docs, default to the first document's ID
      return docs[0]?.id || null;
    }
    
    const activeDoc = docs.find(d => d.slug === slug);
    return activeDoc?.id || null;
  }, [pathname, docs]);

  const filteredDocs = useMemo(() => 
    docs.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    ), [docs, searchQuery]
  );

  // Find the selected doc title to show in the mobile header
  const selectedDocTitle = useMemo(() => {
    const activeDoc = docs.find(d => d.id === selectedDocId);
    return activeDoc?.title || "";
  }, [docs, selectedDocId]);

  return (
    <>
      <Navbar />
      
      {/* Sidebar Navigation */}
      <DocsSidebar 
        docs={filteredDocs}
        selectedDocId={selectedDocId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="min-h-screen pt-24 pb-20 transition-all flex justify-center">
        <div className="w-full max-w-[1440px] flex flex-col lg:flex-row">
          {/* Spacer for fixed sidebar on desktop */}
          <div className="hidden lg:block w-80 shrink-0" />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden sticky top-24 z-40 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-6 py-4 flex items-center justify-between shadow-sm">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary-600"
              >
                <Menu size={18} />
                <span>Documentation</span>
              </button>
              {selectedDocTitle && (
                <span className="text-[10px] font-bold text-muted truncate max-w-[150px] uppercase tracking-tighter">
                  {selectedDocTitle}
                </span>
              )}
            </div>

            {children}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
