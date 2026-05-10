"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Link2
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { ThemedMarkdown } from "@/components/ui/ThemedMarkdown";

interface Doc {
  id: string;
  title: string;
  content: string;
  category: string;
  slug: string;
  order: number;
}

export default function AdminDocs() {
  const { confirm } = useModal();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "# New Document\nStart writing here...",
    category: "Basics",
    slug: "",
    order: 0
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
        setFormData({ title: "", content: "", category: "Basics", slug: "", order: 0 });
        fetchDocs();
      }
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const startEdit = (doc: Doc) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      slug: doc.slug,
      order: doc.order
    });
    setIsAdding(false);
    setPreviewMode(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Document",
      message: "Are you sure you want to delete this document?",
      danger: true
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/docs/${id}`, { method: "DELETE" });
      if (res.ok) fetchDocs();
    } catch (error) {
      console.error("Delete failed", error);
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
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--admin-text-primary)] tracking-tight">Documentation CMS</h1>
          <p className="text-[var(--admin-text-secondary)] font-medium">Manage platform documentation using Markdown with real-time preview.</p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ title: "", content: "# New Section\n", category: "Basics", slug: "", order: 0 }); }}
            className="px-6 py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Section
          </button>
        )}
      </header>

      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-[var(--admin-bg-card)] p-4 rounded-2xl border border-[var(--admin-border)] shadow-sm">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setPreviewMode(false)}
                   className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!previewMode ? 'bg-teal-500 text-white' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)]'}`}
                 >
                   Editor
                 </button>
                 <button 
                   onClick={() => setPreviewMode(true)}
                   className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${previewMode ? 'bg-teal-500 text-white' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)]'}`}
                 >
                   Preview
                 </button>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={handleSave} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                   <Save size={16} />
                   Publish
                 </button>
                 <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                   <X size={20} />
                 </button>
              </div>
            </div>

            {!previewMode ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="p-6 bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm space-y-4">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest pl-1">Title</label>
                       <input 
                         required
                         value={formData.title}
                         onChange={(e) => {
                           const title = e.target.value;
                           setFormData({...formData, title, slug: generateSlug(title)});
                         }}
                         className="w-full p-3 rounded-xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-medium text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest pl-1">Slug</label>
                       <input 
                         required
                         value={formData.slug}
                         onChange={(e) => setFormData({...formData, slug: e.target.value})}
                         className="w-full p-3 rounded-xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-medium text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest pl-1">Category</label>
                       <select 
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                         className="w-full p-3 rounded-xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-medium text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 transition-all appearance-none"
                       >
                         <option>Basics</option>
                         <option>Features</option>
                         <option>API</option>
                         <option>Advanced</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest pl-1">Display Order</label>
                       <input 
                         type="number"
                         value={formData.order}
                         onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                         className="w-full p-3 rounded-xl bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] font-medium text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                       />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full h-[600px] p-8 sm:p-10 rounded-[3rem] bg-[var(--admin-bg-card)] border border-[var(--admin-border)] outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm leading-relaxed shadow-sm text-[var(--admin-text-secondary)] transition-all"
                    placeholder="Enter markdown content..."
                  />
                </div>
              </div>
            ) : (
              <div className="p-10 md:p-20 bg-[var(--admin-bg-card)] rounded-[4rem] border border-[var(--admin-border)] shadow-sm min-h-[600px]">
                <h1 className="text-4xl font-bold text-[var(--admin-text-primary)] mb-8 pb-4 border-b border-[var(--admin-border-subtle)]">{formData.title}</h1>
                <ThemedMarkdown content={formData.content} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && !editingId && (
        <div className="space-y-6">
          <div className="relative mb-8">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 rounded-3xl bg-[var(--admin-bg-card)] border border-[var(--admin-border)] shadow-sm font-medium text-sm text-[var(--admin-text-primary)] outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center animate-pulse text-[var(--admin-text-muted)] font-bold uppercase tracking-widest">Accessing File System...</div>
            ) : filteredDocs.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-[var(--admin-bg-card)] border border-dashed border-[var(--admin-border)] rounded-[3rem] text-[var(--admin-text-secondary)] font-medium">
                 No documents found. Create your first help article!
               </div>
            ) : (
              filteredDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  className="p-8 rounded-[2.5rem] bg-[var(--admin-bg-card)] border border-[var(--admin-border)] shadow-sm hover:shadow-xl hover:border-teal-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                       <span className="px-3 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                         {doc.category}
                       </span>
                       <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase">#{doc.order}</span>
                    </div>
                    <h4 className="text-xl font-bold text-[var(--admin-text-primary)] group-hover:text-teal-500 transition-colors leading-tight">{doc.title}</h4>
                    <p className="text-xs text-[var(--admin-text-muted)] font-medium truncate leading-relaxed">/{doc.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-8 pt-6 border-t border-[var(--admin-border-subtle)]">
                     <button 
                       onClick={() => startEdit(doc)}
                       className="flex-1 py-3 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-secondary)] rounded-xl font-bold text-xs hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                       <Edit2 size={14} />
                       Edit
                     </button>
                     <button 
                       onClick={() => handleDelete(doc.id)}
                       className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center"
                     >
                       <Trash2 size={14} />
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
