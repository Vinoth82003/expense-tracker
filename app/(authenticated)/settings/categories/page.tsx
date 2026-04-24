"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Save, ShieldCheck, User, LayoutGrid } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
  userId: string | null;
}

export default function MyCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", type: "Needs" });
  const [errorProp, setErrorProp] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProp(null);
    try {
      if (editingId) {
        const res = await fetch("/api/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
        if (!res.ok) {
           const err = await res.json();
           setErrorProp(err.error);
           return;
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
           const err = await res.json();
           setErrorProp(err.error);
           return;
        }
      }
      setIsAdding(false);
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom category?")) return;
    
    try {
      await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const startEdit = (category: Category) => {
    setFormData({ name: category.name, type: category.type });
    setEditingId(category.id);
    setIsAdding(true);
    setErrorProp(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const globalCategories = categories.filter(c => c.isDefault);
  const myCategories = categories.filter(c => !c.isDefault);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-border-subtle">
        <div className="space-y-2">
           <div className="flex items-center gap-3 text-primary-600 mb-4">
            <div className="p-3 bg-primary-50 rounded-2xl">
              <LayoutGrid size={28} />
            </div>
            <span className="font-black tracking-widest uppercase text-xs">Category Management</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">My Categories</h1>
          <p className="text-secondary font-medium mt-2">Manage your personalized expense tracking categories.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: "", type: "Needs" }); setErrorProp(null); }}
          className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={20} />
          Custom Category
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 40 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
          >
            <div className="p-5 md:p-10 rounded-[3rem] bg-surface-variant border border-border-subtle relative">
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="absolute top-8 right-8 p-2 rounded-full bg-surface text-secondary hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary-600 rounded-xl text-white">
                  {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">
                  {editingId ? 'Edit Custom Category' : 'New Custom Category'}
                </h3>
              </div>
              
              {errorProp && <p className="text-error font-bold mb-4">{errorProp}</p>}

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-2">Category Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-surface border border-border-subtle focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-sm"
                    placeholder="e.g., Gym, Spotify, Coffee"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-2">Category Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-surface border border-border-subtle focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-sm"
                  >
                    <option value="Needs">Needs (Essentials)</option>
                    <option value="Wants">Wants (Discretionary)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 flex flex-wrap justify-between gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="w-full md:w-auto px-8 py-4 bg-surface text-secondary border border-border-subtle rounded-2xl font-black transition-all hover:bg-surface-variant hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="w-full md:w-auto px-10 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-600/20 transition-all flex items-center gap-2 hover:bg-primary-700"
                  >
                    <Save size={18} />
                    {editingId ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
         <div className="py-20 text-center animate-pulse text-muted font-black tracking-widest">LOADING DATABASE...</div>
      ) : (
         <div className="space-y-12">
            {/* Custom Categories Section */}
            <section>
               <h2 className="text-xl font-black flex items-center gap-2 mb-6">
                 <User size={20} className="text-primary-500" />
                 My Custom Categories
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {myCategories.length === 0 ? (
                    <div className="col-span-full p-10 text-center bg-surface border border-dashed border-border-subtle rounded-[2rem] text-muted font-bold text-sm">
                       You haven't created any custom categories yet.
                    </div>
                 ) : (
                   myCategories.map(category => (
                     <div
                       key={category.id}
                       className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary-500/30 transition-all"
                     >
                       <div className="space-y-3">
                         <div className="flex justify-between items-start">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             category.type === 'Needs' ? 'bg-primary-50 text-primary-600' : 'bg-cyan-50 text-cyan-600'
                           }`}>
                             {category.type}
                           </span>
                         </div>
                         <h4 className="text-xl font-black text-foreground">{category.name}</h4>
                       </div>
                       <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-subtle">
                          <button 
                            onClick={() => startEdit(category)}
                            className="flex-1 py-2 bg-surface-variant text-secondary rounded-xl font-black text-xs hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)}
                            className="flex-1 py-2 bg-surface-variant text-secondary rounded-xl font-black text-xs hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </section>

            {/* Global Categories Section */}
            <section>
               <h2 className="text-xl font-black flex items-center gap-2 mb-6">
                 <ShieldCheck size={20} className="text-tertiary-500" />
                 Global System Categories
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {globalCategories.map(category => (
                    <div key={category.id} className="p-5 rounded-[1.5rem] bg-surface-variant border border-border-subtle flex flex-col gap-2">
                       <h4 className="text-base font-black text-foreground">{category.name}</h4>
                       <span className={`w-fit px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest opacity-80 ${
                         category.type === 'Needs' ? 'bg-primary-500 text-white' : 'bg-cyan-500 text-white'
                       }`}>
                         {category.type}
                       </span>
                    </div>
                 ))}
               </div>
            </section>
         </div>
      )}
    </div>
  );
}
