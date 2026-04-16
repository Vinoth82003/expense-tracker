"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, IndianRupee, Tag, FileText, Calendar, ChevronDown, Loader2, Plus, ShoppingCart, Sparkles, Pencil } from "lucide-react";
import { useUI } from "@/context/UIContext";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  note: string | null;
  date: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editExpense?: Expense | null;
}

const CATEGORY_TYPES = ["Needs", "Wants"];

export function AddExpenseModal({ isOpen, onClose, onSuccess, editExpense }: AddExpenseModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    category: "Needs",
    subcategory: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data.categories || []));
      
      if (editExpense) {
        setForm({
          amount: editExpense.amount.toString(),
          category: editExpense.category,
          subcategory: editExpense.subcategory,
          note: editExpense.note || "",
          date: new Date(editExpense.date).toISOString().split("T")[0],
        });
      } else {
        setForm({
          amount: "",
          category: "Needs",
          subcategory: "",
          note: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [isOpen, editExpense]);

  const filteredSubcategories = categories.filter((c) => c.type === form.category);

  const { toast } = useUI();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.amount || parseFloat(form.amount) <= 0) newErrors.amount = "Enter a valid amount";
    if (!form.subcategory) newErrors.subcategory = "Select a subcategory";
    if (!form.date) newErrors.date = "Select a date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const url = editExpense ? `/api/expenses/${editExpense.id}` : "/api/expenses";
      const method = editExpense ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          category: form.category,
          subcategory: form.subcategory,
          note: form.note,
          date: form.date,
        }),
      });

      if (res.ok) {
        toast.success(editExpense ? "Expense updated!" : "Expense recorded!");
        window.dispatchEvent(new CustomEvent('expenseAdded'));
        onSuccess();
        onClose();
      } else {
        toast.error("Failed to save. Please check inputs.");
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
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
                  editExpense ? "bg-tertiary-500/10 text-tertiary-500" : "bg-primary-500/10 text-primary-500"
                }`}>
                  {editExpense ? <Pencil size={20} /> : <Plus size={22} />}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {editExpense ? "Edit Expense" : "New Expense"}
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
              {/* Amount - The Hero Input */}
              <div className="text-center mb-8">
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3">
                  How much did you spend?
                </label>
                <div className="relative inline-flex items-center group">
                   <IndianRupee size={32} className="text-primary-500 mr-2" />
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

              {/* Category Selection */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-surface-variant rounded-2xl">
                {CATEGORY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, category: type, subcategory: "" })}
                    className={`py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      form.category === type
                        ? "bg-primary-500 text-white shadow-lg"
                        : "text-secondary hover:text-foreground"
                    }`}
                  >
                    {type === "Needs" ? <ShoppingCart size={16} /> : <Sparkles size={16} />}
                    {type}
                  </button>
                ))}
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                {/* Subcategory */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary">
                    <Tag size={18} />
                  </div>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className={`w-full bg-background border-2 rounded-2xl py-4 pl-12 pr-10 font-bold text-foreground appearance-none focus:outline-none transition-all ${
                      errors.subcategory ? "border-error" : "border-border-subtle focus:border-primary-500"
                    }`}
                  >
                    <option value="">Select subcategory…</option>
                    {filteredSubcategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute inset-y-0 right-4 my-auto text-secondary pointer-events-none" />
                </div>

                {/* Date & Note in row for desktop, column for mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar size={18} className="absolute inset-y-0 left-4 my-auto text-secondary pointer-events-none" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-background border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground text-sm focus:outline-none focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <FileText size={18} className="absolute inset-y-0 left-4 my-auto text-secondary pointer-events-none" />
                    <input
                      type="text"
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Add a note..."
                      className="w-full bg-background border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground text-sm focus:outline-none focus:border-primary-500 transition-all"
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
                  className="w-full py-5 rounded-2xl bg-foreground text-background font-black text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      {editExpense ? "Update Expense" : "Confirm Payment"}
                      <ChevronDown className="-rotate-90" size={20} />
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
