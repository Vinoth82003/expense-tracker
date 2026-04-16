"use client";

import { useSession } from "next-auth/react";
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
  AlertCircle
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation (Simple Version) */}
        <div className="md:col-span-1 space-y-2">
           {[
             { name: "General Preference", icon: SettingsIcon, active: true },
             { name: "Account Details", icon: User, active: false },
             { name: "Security", icon: ShieldCheck, active: false },
             { name: "Notifications", icon: Bell, active: false },
             { name: "Billing", icon: CreditCard, active: false },
           ].map((item) => (
             <button
               key={item.name}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                 item.active 
                  ? "bg-surface border border-border-subtle shadow-sm text-foreground" 
                  : "text-secondary hover:text-foreground opacity-60"
               }`}
             >
               <item.icon size={20} />
               <span>{item.name}</span>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleUpdate} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tracking Mode */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-50 text-primary-500">
                  <SettingsIcon size={24} />
                </div>
                <h2 className="text-xl font-black">Tracking Preferences</h2>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-secondary mb-3 block">Expense Tracking Mode</span>
                  <div className="grid grid-cols-2 gap-4">
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

            {/* Notification & Status */}
            <AnimatePresence>
               {success && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="p-4 rounded-[1.5rem] bg-success/10 border border-success/20 text-success flex items-center gap-3 font-bold"
                 >
                   <CheckCircle2 size={20} />
                   Settings updated successfully!
                 </motion.div>
               )}
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="p-4 rounded-[1.5rem] bg-error/10 border border-error/20 text-error flex items-center gap-3 font-bold"
                 >
                   <AlertCircle size={20} />
                   {error}
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Submit */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted max-w-[280px]">
                <Info size={16} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Changes are synced across your devices instantly.</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-foreground text-background font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Additional Settings Placeholder */}
          <div className="bg-surface/50 border border-border-subtle border-dashed rounded-[2.5rem] p-12 text-center">
            <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 opacity-60">Advanced Controls</h3>
            <p className="text-secondary max-w-sm mx-auto font-medium opacity-60">Security, Data export, and multi-device sync settings will be available in the next version.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
