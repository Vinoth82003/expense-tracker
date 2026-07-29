"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "isomorphic-dompurify";
// SECURITY FIX: VULN-005 — Added DOMPurify import for HTML sanitization
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Save, 
  X,
  FileText,
  Eye,
  Type,
  Link2,
  Code2,
  Globe,
  Clock,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { ThemedMarkdown } from "@/components/ui/ThemedMarkdown";
import { cn } from "@/lib/utils";

import { Doc } from "@/types/docs";

export default function AdminDocs() {
  const { confirm, alert: modalAlert } = useModal();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Omit<Doc, "id" | "updatedAt" | "createdAt">>({
    title: "",
    content: "# New Document\nStart writing here...",
    category: "Basics",
    slug: "",
    order: 0,
    status: "DRAFT",
    contentType: "MARKDOWN"
  });

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/docs");
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch docs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/docs/${editingId}` : "/api/docs";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setEditingId(null);
        setIsAdding(false);
        setFormData({ title: "", content: "", category: "Basics", slug: "", order: 0, status: "DRAFT", contentType: "MARKDOWN" });
        fetchDocs();
        modalAlert({
          title: "Success",
          message: "Document saved successfully!",
          type: "success"
        });
      } else {
        const errorData = await res.json();
        modalAlert({
          title: "Save Failed",
          message: errorData.message || "Please check for duplicate slugs.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Save failed", error);
      modalAlert({
        title: "Error",
        message: "An unexpected error occurred while saving.",
        type: "error"
      });
    }
  };

  const startEdit = (doc: Doc) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      slug: doc.slug,
      order: doc.order,
      status: doc.status,
      contentType: doc.contentType
    });
    setIsAdding(false);
    setPreviewMode(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Document",
      message: "Are you sure you want to delete this document? This action cannot be undone.",
      danger: true
    });
    
    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`/api/docs/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocs();
        modalAlert({
          title: "Deleted",
          message: "Document has been removed.",
          type: "success"
        });
      }
    } catch (error) {
      console.error("Delete failed", error);
      modalAlert({
        title: "Error",
        message: "Failed to delete the document.",
        type: "error"
      });
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600">
               <FileText size={24} />
            </div>
            <h1 className="text-4xl font-bold text-[var(--admin-text-primary)] tracking-tight">Documentation CMS</h1>
          </div>
          <p className="text-[var(--admin-text-secondary)] font-medium max-w-2xl">
            Create and manage professional documentation with support for Markdown and custom HTML.
          </p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => { 
              setIsAdding(true); 
              setEditingId(null); 
              setFormData({ 
                title: "", 
                content: "# New Section\n", 
                category: "Basics", 
                slug: "", 
                order: docs.length, 
                status: "DRAFT", 
                contentType: "MARKDOWN" 
              }); 
            }}
            className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            New Document
          </button>
        )}
      </header>

      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* Editor Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-bg-card)] p-4 rounded-3xl border border-[var(--admin-border)] shadow-xl sticky top-4 z-10">
              <div className="flex items-center gap-2 bg-[var(--admin-bg-surface-variant)] p-1.5 rounded-2xl">
                 <button 
                   onClick={() => setPreviewMode(false)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                     !previewMode ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-[var(--admin-text-secondary)] hover:text-teal-500'
                   )}
                 >
                   <Edit2 size={14} />
                   Editor
                 </button>
                 <button 
                   onClick={() => setPreviewMode(true)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                     previewMode ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-[var(--admin-text-secondary)] hover:text-teal-500'
                   )}
                 >
                   <Eye size={14} />
                   Live Preview
                 </button>
              </div>

              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 pr-4 border-r border-[var(--admin-border-subtle)]">
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer border",
                        formData.status === "PUBLISHED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                      )}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                 </div>

                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => { setIsAdding(false); setEditingId(null); }}
                     className="px-6 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                   >
                     <X size={16} />
                     Discard
                   </button>
                   <button 
                     onClick={handleSave} 
                     className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:-translate-y-0.5 transition-all"
                   >
                     <Save size={16} />
                     {editingId ? "Save Changes" : "Publish Now"}
                   </button>
                 </div>
              </div>
            </div>

            {/* Main Content Area */}
            {!previewMode ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="p-8 bg-[var(--admin-bg-card)] rounded-[2.5rem] border border-[var(--admin-border)] shadow-lg space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[var(--admin-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                         <Type size={12} /> Basic Info
                       </label>
                       <div className="space-y-4">
                         <div className="space-y-1.5">
                           <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">Document Title</span>
                           <input 
                             required
                             placeholder="E.g. Getting Started"
                             value={formData.title}
                             onChange={(e) => {
                               const title = e.target.value;
                               setFormData({...formData, title, slug: generateSlug(title)});
                             }}
                             className="w-full p-4 rounded-2xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-bold text-sm text-[var(--admin-text-primary)] focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                           />
                         </div>
                         <div className="space-y-1.5">
                           <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">URL Slug</span>
                           <div className="relative">
                             <Link2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
                             <input 
                               required
                               value={formData.slug}
                               onChange={(e) => setFormData({...formData, slug: e.target.value})}
                               className="w-full pl-10 pr-4 py-4 rounded-2xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-medium text-xs text-[var(--admin-text-secondary)] focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                             />
                           </div>
                         </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[var(--admin-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                         <Code2 size={12} /> Content Type
                       </label>
                       <div className="grid grid-cols-2 gap-2 bg-[var(--admin-bg-surface-variant)] p-1.5 rounded-2xl">
                         <button 
                           onClick={() => setFormData({...formData, contentType: "MARKDOWN"})}
                           className={cn(
                             "py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                             formData.contentType === "MARKDOWN" ? "bg-[var(--admin-bg-card)] text-teal-600 shadow-sm" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-secondary)]"
                           )}
                         >
                           Markdown
                         </button>
                         <button 
                           onClick={() => setFormData({...formData, contentType: "HTML"})}
                           className={cn(
                             "py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                             formData.contentType === "HTML" ? "bg-[var(--admin-bg-card)] text-teal-600 shadow-sm" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-secondary)]"
                           )}
                         >
                           HTML Content
                         </button>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[var(--admin-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                         <Globe size={12} /> Organization
                       </label>
                       <div className="space-y-4">
                         <div className="space-y-1.5">
                           <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">Category</span>
                           <select 
                             value={formData.category}
                             onChange={(e) => setFormData({...formData, category: e.target.value})}
                             className="w-full p-4 rounded-2xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-bold text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                           >
                             <option>Basics</option>
                             <option>Features</option>
                             <option>API</option>
                             <option>Advanced</option>
                           </select>
                         </div>
                         <div className="space-y-1.5">
                           <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">Sort Order</span>
                           <input 
                             type="number"
                             value={formData.order}
                             onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                             className="w-full p-4 rounded-2xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-bold text-sm text-[var(--admin-text-primary)] focus:ring-2 focus:ring-teal-500 outline-none"
                           />
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Content Editor */}
                <div className="lg:col-span-9">
                  <div className="relative group">
                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="px-3 py-1 bg-black/40 text-white text-[9px] font-black uppercase tracking-widest rounded-lg backdrop-blur-md">
                         {formData.contentType} Mode
                       </span>
                    </div>
                    <textarea 
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="w-full h-[700px] p-10 md:p-14 rounded-[3.5rem] bg-[var(--admin-bg-card)] border border-[var(--admin-border)] outline-none focus:ring-2 focus:ring-teal-500/30 font-mono text-sm leading-relaxed shadow-2xl text-[var(--admin-text-secondary)] transition-all resize-none"
                      placeholder={formData.contentType === "MARKDOWN" ? "Enter markdown here..." : "Enter HTML with Tailwind classes..."}
                    />
                  </div>
                  {formData.contentType === "HTML" && (
                    <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
                      <AlertCircle size={18} className="text-amber-500" />
                      <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">Note: HTML content supports standard Tailwind utility classes.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Preview Area */
              <div className="p-10 md:p-24 bg-[var(--admin-bg-card)] rounded-[4rem] border border-[var(--admin-border)] shadow-2xl min-h-[800px] animate-in fade-in zoom-in-95 duration-500">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-12 space-y-4">
                    <div className="flex items-center gap-3">
                       <span className="px-4 py-1 bg-teal-500/10 text-teal-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                         {formData.category}
                       </span>
                       <div className="w-1.5 h-1.5 rounded-full bg-[var(--admin-border)]" />
                       <span className="text-[10px] font-black text-[var(--admin-text-muted)] uppercase tracking-widest">
                         Slug: /{formData.slug}
                       </span>
                    </div>
                    <h1 className="text-6xl font-black text-[var(--admin-text-primary)] tracking-tightest leading-[0.9]">{formData.title}</h1>
                  </div>

                  {formData.contentType === "MARKDOWN" ? (
                    <ThemedMarkdown content={formData.content} />
                  ) : (
                    <div 
                      className="prose-none"
                      // SECURITY FIX: VULN-005 — DOMPurify sanitizes HTML before rendering
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content, { ADD_TAGS: ["iframe"], ADD_ATTR: ["allowfullscreen", "frameborder", "allow"] }) }} 
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid List View */}
      {!isAdding && !editingId && (
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-xl">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
              <input 
                type="text" 
                placeholder="Search articles by title or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-[var(--admin-bg-card)] border border-[var(--admin-border)] shadow-xl font-bold text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-[var(--admin-text-muted)]"
              />
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-[var(--admin-text-muted)]">
               <span>{filteredDocs.length} Documents Found</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6">
                 <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                 <p className="font-black text-[10px] text-[var(--admin-text-muted)] uppercase tracking-[0.3em] animate-pulse">Syncing Documentation Database...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
               <div className="col-span-full py-32 text-center bg-[var(--admin-bg-card)] border border-dashed border-[var(--admin-border)] rounded-[4rem] flex flex-col items-center justify-center space-y-6">
                 <FileText size={48} className="text-[var(--admin-text-muted)] opacity-20" />
                 <div className="space-y-2">
                   <h3 className="text-xl font-black text-[var(--admin-text-primary)]">The library is empty.</h3>
                   <p className="text-[var(--admin-text-secondary)] font-medium">Start building your knowledge base by creating a new document.</p>
                 </div>
                 <button 
                   onClick={() => setIsAdding(true)}
                   className="px-8 py-3 bg-teal-500 text-white rounded-2xl font-bold text-xs"
                 >
                   Create First Doc
                 </button>
               </div>
            ) : (
              filteredDocs.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-10 rounded-[3rem] bg-[var(--admin-bg-card)] border border-[var(--admin-border)] shadow-sm hover:shadow-2xl hover:border-teal-500/30 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Status Indicator */}
                  <div className="absolute top-0 right-0 p-6">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                      doc.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", doc.status === "PUBLISHED" ? "bg-emerald-500" : "bg-amber-500")} />
                      {doc.status}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-muted)] text-[9px] font-black uppercase tracking-widest rounded-lg">
                         {doc.category}
                       </span>
                       <span className="px-3 py-1 bg-teal-500/5 text-teal-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                         {doc.contentType}
                       </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-[var(--admin-text-primary)] group-hover:text-teal-500 transition-colors leading-[1.1]">{doc.title}</h4>
                      <p className="text-xs text-[var(--admin-text-muted)] font-medium flex items-center gap-1.5 italic">
                        <Link2 size={12} /> /{doc.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
                       <div className="flex items-center gap-1.5">
                         <Clock size={12} />
                         Updated {new Date(doc.updatedAt || Date.now()).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-1.5">
                         <ChevronRight size={12} />
                         Pos {doc.order}
                       </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                         <ThumbsUp size={12} />
                         {doc.helpfulCount || 0}
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded-md">
                         <ThumbsDown size={12} />
                         {doc.notHelpfulCount || 0}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-10">
                     <button 
                       onClick={() => startEdit(doc)}
                       className="flex-1 py-4 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-primary)] rounded-2xl font-black text-xs hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                     >
                       <Edit2 size={14} className="group-hover/btn:rotate-12 transition-transform" />
                       Configure
                     </button>
                     <button 
                       onClick={() => handleDelete(doc.id)}
                       className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
