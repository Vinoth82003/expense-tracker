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
    if (!confirm("Are you sure you want to delete this document?")) return;
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
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Documentation CMS</h1>
          <p className="text-secondary font-medium">Manage platform documentation using Markdown with real-time preview.</p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ title: "", content: "# New Section\n", category: "Basics", slug: "", order: 0 }); }}
            className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
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
            <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setPreviewMode(false)}
                   className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${!previewMode ? 'bg-primary-600 text-white' : 'text-secondary hover:bg-surface-variant'}`}
                 >
                   Editor
                 </button>
                 <button 
                   onClick={() => setPreviewMode(true)}
                   className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${previewMode ? 'bg-primary-600 text-white' : 'text-secondary hover:bg-surface-variant'}`}
                 >
                   Preview
                 </button>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={handleSave} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                   <Save size={16} />
                   Publish
                 </button>
                 <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                   <X size={20} />
                 </button>
              </div>
            </div>

            {!previewMode ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="p-6 bg-surface rounded-[2rem] border border-border-subtle space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Title</label>
                       <input 
                         required
                         value={formData.title}
                         onChange={(e) => {
                           const title = e.target.value;
                           setFormData({...formData, title, slug: generateSlug(title)});
                         }}
                         className="w-full p-3 rounded-xl bg-surface border border-border-subtle font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Slug</label>
                       <input 
                         required
                         value={formData.slug}
                         onChange={(e) => setFormData({...formData, slug: e.target.value})}
                         className="w-full p-3 rounded-xl bg-surface border border-border-subtle font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Category</label>
                       <select 
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                         className="w-full p-3 rounded-xl bg-surface border border-border-subtle font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                       >
                         <option>Basics</option>
                         <option>Features</option>
                         <option>API</option>
                         <option>Advanced</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Display Order</label>
                       <input 
                         type="number"
                         value={formData.order}
                         onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                         className="w-full p-3 rounded-xl bg-surface border border-border-subtle font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                       />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full h-[600px] p-10 rounded-[3rem] bg-surface border border-border-subtle outline-none focus:ring-2 focus:ring-primary-500/20 font-mono text-sm leading-relaxed shadow-lg"
                    placeholder="Enter markdown content..."
                  />
                </div>
              </div>
            ) : (
              <div className="p-10 md:p-20 bg-surface rounded-[4rem] border border-border-subtle shadow-xl min-h-[600px]">
                <h1 className="text-4xl font-black text-foreground mb-8 pb-4 border-b border-border-subtle">{formData.title}</h1>
                <ThemedMarkdown content={formData.content} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && !editingId && (
        <div className="space-y-6">
          <div className="relative mb-8">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 rounded-3xl bg-surface border border-border-subtle shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center animate-pulse text-muted font-black uppercase tracking-widest">Accessing File System...</div>
            ) : filteredDocs.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-surface border border-dashed border-border-subtle rounded-[3rem] text-secondary font-bold">
                 No documents found. Create your first help article!
               </div>
            ) : (
              filteredDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                       <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                         {doc.category}
                       </span>
                       <span className="text-[10px] font-black text-muted uppercase">#{doc.order}</span>
                    </div>
                    <h4 className="text-xl font-black text-foreground group-hover:text-primary-600 transition-colors leading-tight">{doc.title}</h4>
                    <p className="text-xs text-muted font-bold truncate leading-relaxed">/{doc.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border-subtle">
                     <button 
                       onClick={() => startEdit(doc)}
                       className="flex-1 py-3 bg-surface-variant text-secondary rounded-xl font-black text-xs hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                       <Edit2 size={14} />
                       Edit
                     </button>
                     <button 
                       onClick={() => handleDelete(doc.id)}
                       className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all flex items-center justify-center"
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
