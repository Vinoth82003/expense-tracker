"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit3, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Layers, 
  GitMerge, 
  Info,
  X,
  Smartphone,
  Coffee,
  Home,
  Briefcase,
  ShoppingBag,
  Zap,
  Car,
  Heart,
  Music,
  Globe,
  Lock,
  Gift
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const ICON_LIST = {
  Smartphone, Coffee, Home, Briefcase, ShoppingBag, Zap, Car, Heart, Music, Globe, Lock, Gift, Settings, Info
};

const COLOR_PRESETS = [
  "#00D4AA", "#38BDF8", "#818CF8", "#F472B6", "#FB7185", "#FBBF24", "#A3E635", "#2DD4BF", "#94A3B8", "#0F172A", "#6366F1", "#EC4899"
];

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  usageCount?: number;
  volume?: number;
}

interface Subcategory {
  id: string;
  name: string;
  type: string;
  color: string | null;
  userId: string;
  user: { name: string, email: string };
  usageCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [totalSub, setTotalSub] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastCleared, setLastCleared] = useState<Date>(new Date(Date.now() - 2 * 60 * 60 * 1000));
  const [hasEdits, setHasEdits] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [sourceSub, setSourceSub] = useState<Subcategory | null>(null);
  const [targetSubId, setTargetSubId] = useState("");

  // Form State
  const [formData, setFormData] = useState({ name: "", type: "Needs", icon: "Settings", color: "#00D4AA" });
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [subFilter, setSubFilter] = useState("All");
  const [subPage, setSubPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch(`/api/admin/subcategories?category=${subFilter}&page=${subPage}`)
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (subRes.ok) {
        const result = await subRes.json();
        setSubcategories(result.subcategories);
        setTotalSub(result.total);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, [subFilter, subPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidateCache = async () => {
    try {
      const res = await fetch("/api/admin/cache/invalidate", { method: "POST" });
      if (res.ok) {
        setLastCleared(new Date());
        setHasEdits(false);
      }
    } catch (error) {
      console.error("Failed to invalidate cache", error);
    }
  };

  const handleSaveCategory = async () => {
    setActionLoading(true);
    try {
      const url = editingCat ? `/api/admin/categories/${editingCat.id}` : "/api/admin/categories";
      const method = editingCat ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setEditingCat(null);
        setHasEdits(true);
        fetchData();
        invalidateCache(); // Auto-clear cache on save
      }
    } catch (error) {
      console.error("Failed to save", error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHasEdits(true);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const handleMerge = async () => {
    if (!sourceSub || !targetSubId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/subcategories/merge", {
        method: "POST",
        body: JSON.stringify({ sourceId: sourceSub.id, targetId: targetSubId })
      });
      if (res.ok) {
        setIsMergeModalOpen(false);
        setHasEdits(true);
        fetchData();
        invalidateCache();
      }
    } catch (error) {
      console.error("Failed to merge", error);
    } finally {
      setActionLoading(false);
    }
  };

  const topCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return [...categories].sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
  }, [categories]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Global categories</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">System category and subcategory master list</p>
        </div>
        <button 
          onClick={() => { setEditingCat(null); setFormData({ name: "", type: "Needs", icon: "Settings", color: "#00D4AA" }); setIsAddModalOpen(true); }}
          className="px-6 py-3 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Cache Status Banner */}
      <AnimatePresence>
        {hasEdits ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="animate-pulse" />
              <p className="text-sm font-bold">Edits made since last cache clear — users may see stale categories. Clear now?</p>
            </div>
            <button onClick={invalidateCache} className="px-4 py-1.5 bg-white text-amber-600 rounded-xl text-xs font-black uppercase hover:bg-slate-100 transition-colors">
              Invalidate Now
            </button>
          </motion.div>
        ) : (
          <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
              <CheckCircle2 size={20} />
              <p className="text-sm font-bold">Cache last cleared: {Math.round((Date.now() - lastCleared.getTime()) / 60000)} minutes ago</p>
            </div>
            <button onClick={invalidateCache} className="flex items-center gap-2 px-4 py-1.5 bg-teal-500 text-white rounded-xl text-xs font-black uppercase hover:bg-teal-600 transition-colors">
              <RefreshCcw size={14} />
              Refresh
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="System Categories" value={categories.length.toString()} icon={Settings} color="text-teal-500" />
        <StatCard label="User Subcategories" value={totalSub.toString()} icon={Layers} color="text-blue-500" />
        <StatCard label="Top Category" value={topCategory?.name || "N/A"} icon={Zap} color="text-amber-500" />
      </div>

      {/* System Categories Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="text-teal-500" size={24} />
          System Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <motion.div 
              key={cat.id} 
              whileHover={{ y: -4 }}
              className="p-6 bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 group"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: cat.color || '#00D4AA' }}
                >
                  {(() => {
                    const Icon = (ICON_LIST as any)[cat.icon || 'Settings'] || Settings;
                    return <Icon size={24} />;
                  })()}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingCat(cat); setFormData({ name: cat.name, type: cat.type, icon: cat.icon || "Settings", color: cat.color || "#00D4AA" }); setIsAddModalOpen(true); }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-teal-500"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cat.type}</span>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500">
                  {cat.usageCount} usages
                </span>
                <span className="px-3 py-1 bg-teal-50 dark:bg-teal-500/10 rounded-lg text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  ₹{(cat.volume || 0).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
          <button 
            onClick={() => { setEditingCat(null); setFormData({ name: "", type: "Needs", icon: "Settings", color: "#00D4AA" }); setIsAddModalOpen(true); }}
            className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-teal-500 hover:border-teal-500 hover:bg-teal-50/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-500/20 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-bold">Add Category</span>
          </button>
        </div>
      </section>

      {/* User Subcategories Table */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="text-blue-500" size={24} />
            User Subcategories
          </h2>
          <div className="flex gap-4">
            <select 
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none"
            >
              <option value="All">All Types</option>
              <option value="Needs">Needs</option>
              <option value="Wants">Wants</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#1E2536]/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="py-5 px-6">Parent Type</th>
                  <th className="py-5 px-6">Subcategory Name</th>
                  <th className="py-5 px-6">Created By</th>
                  <th className="py-5 px-6">Usage</th>
                  <th className="py-5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {subcategories.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${sub.type === 'Needs' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-purple-50 text-purple-600 dark:bg-purple-500/10'}`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900 dark:text-slate-200">{sub.name}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sub.user.name}</span>
                        <span className="text-[10px] text-slate-500">{sub.user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-slate-500">used {sub.usageCount}×</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSourceSub(sub); setTargetSubId(""); setIsMergeModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Merge"
                        >
                          <GitMerge size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#161B27] rounded-[2.5rem] p-10 shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {editingCat ? "Edit Category" : "New Global Category"}
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</label>
                  <input 
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Category name..."
                    className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</label>
                    <select 
                      value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl outline-none text-sm font-bold"
                    >
                      <option value="Needs">Needs</option>
                      <option value="Wants">Wants</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Icon</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {Object.keys(ICON_LIST).map(iconName => {
                        const IconComp = (ICON_LIST as any)[iconName];
                        return (
                          <button 
                            key={iconName}
                            onClick={() => setFormData({ ...formData, icon: iconName })}
                            className={`p-3 rounded-xl border transition-all ${formData.icon === iconName ? 'bg-teal-500 border-teal-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                          >
                            <IconComp size={20} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Color Swatch</label>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_PRESETS.map(color => (
                      <button 
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-teal-500 scale-125' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleSaveCategory}
                  disabled={actionLoading || !formData.name}
                  className="w-full py-5 bg-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-teal-500/20 hover:bg-teal-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={24} />
                  {actionLoading ? "Saving..." : "Save and clear cache"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Merge Modal */}
      <AnimatePresence>
        {isMergeModalOpen && sourceSub && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#161B27] rounded-[2rem] p-10 shadow-2xl space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <GitMerge size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Merge Subcategories</h3>
                  <p className="text-sm text-slate-500">
                    Combining <strong>{sourceSub.name}</strong> into another category.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400">Target Category</label>
                <select 
                  value={targetSubId} onChange={(e) => setTargetSubId(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-bold"
                >
                  <option value="">Select target...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} (Global)</option>)}
                  {subcategories.filter(s => s.id !== sourceSub.id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.user.name})</option>)}
                </select>
                <p className="text-xs bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-blue-600 dark:text-blue-400 leading-relaxed italic">
                  "All {sourceSub.usageCount} transactions will be re-tagged to the target. This action auto-clears the global cache."
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleMerge}
                  disabled={!targetSubId || actionLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {actionLoading ? "Merging..." : "Confirm & Merge"}
                </button>
                <button onClick={() => setIsMergeModalOpen(false)} className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="p-6 bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
