"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useUI } from "@/context/UIContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  CreditCard, 
  User, 
  ChevronRight,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Monitor,
  Moon as MoonIcon,
  Sun as SunIcon,
  LayoutGrid
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useUI();

  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState({
    expenseMode: "limit",
    monthlyLimit: "0",
  });

  useEffect(() => {
    if (session?.user) {
      setForm({
        expenseMode: (session.user as any).expenseMode || "limit",
        monthlyLimit: ((session.user as any).monthlyLimit || 0).toString(),
      });
    }
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseMode: form.expenseMode,
          monthlyLimit: parseFloat(form.monthlyLimit),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Update session client-side
        await update();
      } else {
        setError("Failed to save settings. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/user/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spendwise_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("CSV Export starting!");
      } else {
        toast.error("Failed to export data.");
      }
    } catch (err) {
      toast.error("An error occurred during export.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleWipe = async () => {
    if (!confirm("Are you ABSOLUTELY sure? This will delete ALL your transactions permanently. This action cannot be undone.")) {
      return;
    }

    setDataLoading(true);
    try {
      const res = await fetch("/api/user/wipe", { method: "DELETE" });
      if (res.ok) {
        toast.success("All data has been wiped.");
        setForm({ ...form, monthlyLimit: "0" });
        // Refresh session/data
        await update();
      } else {
        toast.error("Failed to wipe data.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation (Simple Version) */}
        <div className="md:col-span-1 space-y-2">
           {[
             { id: "general", name: "General Preference", icon: SettingsIcon },
             { id: "display", name: "Appearance", icon: Monitor },
             { id: "data", name: "Data & Export", icon: Download },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                 activeTab === item.id 
                  ? "bg-surface border border-border-subtle shadow-sm text-foreground" 
                  : "text-secondary hover:text-foreground opacity-60 hover:opacity-100"
               }`}
             >
               <item.icon size={20} />
               <span>{item.name}</span>
             </button>
           ))}
           
           <div className="pt-6 mt-6 border-t border-border-subtle">
             <Link href="/profile" className="flex items-center gap-2 text-xs font-bold text-muted hover:text-primary-500 transition-colors uppercase tracking-widest pl-2">
               Account & Security <ChevronRight size={14} />
             </Link>
           </div>
        </div>

        <div className="md:col-span-2 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <form onSubmit={handleUpdate} className="space-y-8">
                  {/* Tracking Mode */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary-50 text- primary-500">
                        <SettingsIcon size={24} />
                      </div>
                      <h2 className="text-xl font-black">Tracking Preferences</h2>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-bold text-secondary mb-3 block">Expense Tracking Mode</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {["limit", "no-limit"].map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setForm({ ...form, expenseMode: mode })}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                form.expenseMode === mode
                                  ? "border-primary-500 bg-primary-50/30 ring-1 ring-primary-500"
                                  : "border-border-subtle bg-surface-variant/30 hover:border-secondary"
                              }`}
                            >
                              <span className="block font-black capitalize text-lg mb-1">{mode.replace("-", " ")}</span>
                              <span className="text-xs text-secondary font-medium leading-relaxed">
                                {mode === "limit" 
                                  ? "Set a monthly budget and track your remaining balance." 
                                  : "Track expenses purely without a fixed budget limit."}
                              </span>
                            </button>
                          ))}
                        </div>
                      </label>

                      {form.expenseMode === "limit" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-4"
                        >
                          <label className="block space-y-3">
                            <span className="text-sm font-bold text-secondary">Monthly Budget Limit (₹)</span>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-xl font-black text-secondary">₹</div>
                              <input
                                type="number"
                                value={form.monthlyLimit}
                                onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
                                className="w-full bg-surface-variant/20 border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-6 font-black text-2xl focus:outline-none focus:border-primary-500 transition-all"
                                placeholder="e.g., 50000"
                              />
                            </div>
                          </label>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Category Management Link */}
                  <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm space-y-6">
                    <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
                          <LayoutGrid size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black">Categories</h2>
                          <p className="text-xs text-secondary font-medium">Manage your custom needs and wants labels.</p>
                        </div>
                      </div>
                      <Link 
                        href="/settings/categories"
                        className="w-full md:w-auto px-6 py-3 bg-surface-variant text-foreground text-center font-bold rounded-xl hover:bg-border-subtle transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        Manage <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* Feedback */}
                  {(success || error) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-[1.5rem] flex items-center gap-3 font-bold border ${
                        success ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
                      }`}
                    >
                      {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      {success ? "Settings updated successfully!" : error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <div className="mt-8 mb-8 flex flex-wrap md:flex-nowrap items-center justify-center gap-4">
                    <div className="flex items-center gap-2 text-muted">
                      <Info size={16} className="shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">Changes are synced across your devices instantly.</p>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className=" px-10 py-4 bg-foreground text-background font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : "Save Changes"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === "display" && (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500">
                      <Monitor size={24} />
                    </div>
                    <h2 className="text-xl font-black">Appearance</h2>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-bold text-secondary block">Select Theme</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: "light", name: "Light", icon: SunIcon },
                        { id: "dark", name: "Dark", icon: MoonIcon },
                        { id: "system", name: "System", icon: Monitor },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                            theme === t.id
                              ? "border-primary-500 bg-primary-50/10 ring-1 ring-primary-500"
                              : "border-border-subtle bg-surface-variant/30 hover:border-secondary"
                          }`}
                        >
                          <t.icon size={28} className={theme === t.id ? "text-primary-500" : "text-muted"} />
                          <span className="font-black text-sm uppercase tracking-widest">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Data Export */}
                <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-success/10 text-success">
                      <Download size={24} />
                    </div>
                    <h2 className="text-xl font-black">Data & Export</h2>
                  </div>
                  
                  <p className="text-secondary font-medium leading-relaxed">
                    Download a full record of your financial history including all expenses and incomes in CSV format.
                  </p>

                  <button 
                    disabled={dataLoading}
                    className="w-full sm:w-auto px-10 py-4 bg-success text-white font-black rounded-2xl shadow-lg shadow-success/20 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    onClick={handleExport}
                  >
                    {dataLoading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    Export CSV
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-error/5 border border-error/20 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-error/10 text-error">
                      <Trash2 size={24} />
                    </div>
                    <h2 className="text-xl font-black text-error">Danger Zone</h2>
                  </div>

                  <p className="text-error/80 font-medium leading-relaxed">
                    Once you delete your transaction records, they cannot be recovered. This will reset your expenses and incomes to zero.
                  </p>

                  <button 
                    disabled={dataLoading}
                    className="w-full sm:w-auto px-10 py-4 bg-error text-white font-black rounded-2xl shadow-lg shadow-error/20 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    onClick={handleWipe}
                  >
                    {dataLoading ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    Wipe All Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
