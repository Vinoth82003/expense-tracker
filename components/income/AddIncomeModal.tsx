"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  IndianRupee, 
  Briefcase, 
  FileText, 
  Calendar, 
  ChevronDown, 
  Loader2, 
  Plus, 
  Banknote, 
  Sparkles, 
  Pencil,
  TrendingUp,
  Gift
} from "lucide-react";
import { useUI } from "@/context/UIContext";

interface Income {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  date: string;
}

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editIncome?: Income | null;
}

const INCOME_SOURCES = [
  { name: "Salary", icon: Briefcase, color: "bg-primary-500" },
  { name: "Freelance", icon: TrendingUp, color: "bg-success" },
  { name: "Investment", icon: Banknote, color: "bg-warning" },
  { name: "Gift", icon: Gift, color: "bg-tertiary-500" },
  { name: "Others", icon: Sparkles, color: "bg-secondary" },
];

export function AddIncomeModal({ isOpen, onClose, onSuccess, editIncome }: AddIncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    source: "Salary",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editIncome) {
        setForm({
          amount: editIncome.amount.toString(),
          source: editIncome.source,
          note: editIncome.note || "",
          date: new Date(editIncome.date).toISOString().split("T")[0],
        });
      } else {
        setForm({
          amount: "",
          source: "Salary",
          note: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [isOpen, editIncome]);

  const { toast } = useUI();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.amount || parseFloat(form.amount) <= 0) newErrors.amount = "Enter a valid amount";
    if (!form.source) newErrors.source = "Select a source";
    if (!form.date) newErrors.date = "Select a date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const url = editIncome ? `/api/income/${editIncome.id}` : "/api/income";
      const method = editIncome ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          source: form.source,
          note: form.note,
          date: form.date,
        }),
      });

      if (res.ok) {
        toast.success(editIncome ? "Income updated!" : "Income recorded!");
        window.dispatchEvent(new CustomEvent('incomeAdded'));
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save. Please check inputs.");
      }
    } catch (err) {
      console.error("Failed to save income:", err);
      toast.error("An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full sm:max-w-lg bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-border-subtle max-h-[92vh] overflow-y-auto"
          >
            {/* Drag Handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-4 pb-1 sticky top-0 bg-surface z-10">
              <div className="w-12 h-1.5 rounded-full bg-border-subtle"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sm:py-6 border-b border-border-subtle/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  editIncome ? "bg-success/10 text-success" : "bg-primary-500/10 text-primary-500"
                }`}>
                  {editIncome ? <Pencil size={20} /> : <Plus size={22} />}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {editIncome ? "Edit Income" : "Add Income"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-secondary hover:text-foreground transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Amount Section */}
              <div className="text-center mb-8">
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3">
                  How much did you earn?
                </label>
                <div className="relative inline-flex items-center group">
                   <IndianRupee size={32} className="text-success mr-2" />
                   <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoFocus
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-transparent border-none text-5xl sm:text-6xl font-black tracking-tighter text-foreground p-0 focus:outline-none placeholder:text-muted max-w-[280px]"
                  />
                </div>
                {errors.amount && <p className="text-error text-xs mt-2 font-bold">{errors.amount}</p>}
              </div>

              {/* Source Grid */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-muted uppercase tracking-widest pl-1">
                  Income Source
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {INCOME_SOURCES.map((source) => (
                    <button
                      key={source.name}
                      type="button"
                      onClick={() => setForm({ ...form, source: source.name })}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all group ${
                        form.source === source.name
                          ? "border-success bg-success/5 shadow-sm"
                          : "border-border-subtle bg-surface-variant/30 hover:border-secondary/50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform ${
                        form.source === source.name ? source.color : "bg-secondary opacity-50"
                      }`}>
                        <source.icon size={18} />
                      </div>
                      <span className={`font-bold text-sm ${form.source === source.name ? "text-foreground" : "text-secondary"}`}>
                        {source.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                {/* Date & Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar size={18} className="absolute inset-y-0 left-4 my-auto text-secondary pointer-events-none" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-background border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground text-sm focus:outline-none focus:border-success transition-all"
                    />
                  </div>
                  <div className="relative">
                    <FileText size={18} className="absolute inset-y-0 left-4 my-auto text-secondary pointer-events-none" />
                    <input
                      type="text"
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Add a note..."
                      className="w-full bg-background border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground text-sm focus:outline-none focus:border-success transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-success text-white font-black text-lg shadow-xl hover:shadow-success/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      {editIncome ? "Update Record" : "Confirm Deposit"}
                      <TrendingUp size={20} />
                    </>
                  )}
                </motion.button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 text-secondary font-bold hover:text-foreground transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
