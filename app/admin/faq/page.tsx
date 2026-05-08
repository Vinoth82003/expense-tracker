"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  ChevronDown, 
  Save, 
  X,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export default function AdminFAQ() {
  const { confirm } = useModal();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
    order: 0
  });

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faq");
      const data = await res.json();
      setFaqs(data);
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/faq/${editingId}` : "/api/faq";
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
        setFormData({ question: "", answer: "", category: "General", order: 0 });
        fetchFaqs();
      }
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete FAQ",
      message: "Are you sure you want to delete this FAQ?",
      danger: true
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/faq/${id}`, { method: "DELETE" });
      if (res.ok) fetchFaqs();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order
    });
    setIsAdding(false);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Manage FAQ</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Add, edit, or remove frequently asked questions dynamically.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ question: "", answer: "", category: "General", order: 0 }); }}
          className="px-6 py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Question
        </button>
      </header>

      {/* Editor Modal/Section */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 sm:p-10 rounded-[3rem] bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 shadow-sm mb-10 space-y-8 relative">
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="absolute top-8 right-8 p-2 rounded-full bg-slate-50 dark:bg-[#1E2536] text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500 rounded-xl text-white">
                  {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{editingId ? 'Edit Question' : 'New Question'}</h3>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">Question</label>
                  <input 
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-900 dark:text-white text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-900 dark:text-white text-sm transition-all appearance-none"
                  >
                    <option>General</option>
                    <option>Security & Privacy</option>
                    <option>Features & Support</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">Display Order</label>
                  <input 
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-900 dark:text-white text-sm transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">Answer</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    className="w-full p-6 rounded-[2rem] bg-slate-50 dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-900 dark:text-white text-sm leading-relaxed transition-all"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="px-8 py-4 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 hover:bg-teal-600"
                  >
                    <Save size={18} />
                    {editingId ? 'Save Changes' : 'Create FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ List */}
      <div className="space-y-6">
        <div className="relative mb-8">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search questions or categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 shadow-sm font-medium text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
           {loading ? (
             <div className="p-20 text-center animate-pulse text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">LOADING DATABASE...</div>
           ) : filteredFaqs.length === 0 ? (
             <div className="p-20 text-center bg-white dark:bg-[#161B27] border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                <HelpCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 font-medium">No results found matching your search.</p>
             </div>
           ) : (
             filteredFaqs.map((faq) => (
               <motion.div
                 key={faq.id}
                 layout
                 className="p-8 rounded-[2.5rem] bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 group"
               >
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-slate-50 dark:bg-[#1E2536] text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                       {faq.category}
                     </span>
                     <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Order: {faq.order}</span>
                   </div>
                   <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">{faq.question}</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-1">{faq.answer}</p>
                 </div>
                 <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => startEdit(faq)}
                      className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#1E2536] text-slate-600 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-all flex items-center justify-center"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(faq.id)}
                      className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               </motion.div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
