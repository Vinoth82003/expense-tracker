"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, X, Menu, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { Doc } from "@/types/docs";

interface DocsSidebarProps {
  docs: Doc[];
  selectedDocId: string | null;
  onSelect?: (doc: Doc) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function DocsSidebar({
  docs,
  selectedDocId,
  onSelect,
  searchQuery,
  onSearchChange,
  isOpen,
  onClose
}: DocsSidebarProps) {
  // Group docs by category
  const categories = Array.from(new Set(docs.map(d => d.category)));
  
  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-6 pb-2">
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary-500" />
          <input 
            type="text" 
            placeholder="Search documentation..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface-variant border border-border-subtle focus:ring-2 focus:ring-primary-500/10 outline-none font-bold text-[13px] transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface border border-border-subtle text-[9px] text-muted font-black uppercase">
            <span>⌘</span><span>K</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-no">
        {categories.map((category) => {
          const categoryDocs = docs.filter(d => d.category === category);
          if (categoryDocs.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 px-3">
                <Layers size={14} className="text-primary-500" />
                <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{category}</h3>
              </div>
              <div className="space-y-1">
                {categoryDocs.map((doc) => {
                  const isActive = selectedDocId === doc.id;
                  return (
                    <Link
                      key={doc.id}
                      href={`/docs/${doc.slug}`}
                      onClick={() => {
                        if (onSelect) onSelect(doc);
                        onClose();
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl font-bold text-[13px] transition-all flex items-center justify-between group",
                        isActive 
                          ? "bg-primary-500/10 text-primary-600 shadow-sm border border-primary-500/10" 
                          : "hover:bg-surface-variant text-secondary hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{doc.title}</span>
                      <ChevronRight 
                        size={12} 
                        className={cn(
                          "transition-all",
                          isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        )} 
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {docs.length === 0 && searchQuery && (
           <div className="py-10 text-center space-y-3">
             <div className="w-12 h-12 bg-surface-variant rounded-2xl flex items-center justify-center mx-auto text-muted">
                <Search size={20} />
             </div>
             <p className="text-[11px] font-black text-muted uppercase tracking-widest">No matching docs</p>
           </div>
        )}
      </nav>

      {/* Footer hint */}
      {/* <div className="p-6 border-t border-border-subtle bg-surface-variant/30">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm">
           <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600">
             <BookOpen size={16} />
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none mb-1">SpendWise Docs</span>
             <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">v2.4.0 Stable</span>
           </div>
        </div>
      </div> */}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 fixed top-24 bottom-0 left-[max(0px,calc(50%-720px))] border-r border-border-subtle bg-surface">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] sm:w-80 bg-surface z-[101] lg:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="p-2 rounded-xl bg-surface-variant text-secondary hover:text-foreground shadow-sm">
                  <X size={20} />
                </button>
              </div>
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
