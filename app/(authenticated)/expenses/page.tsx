"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Utensils,
  Home,
  Car,
  Zap,
  Shirt,
  Plane,
  GraduationCap,
  Film,
  Gift,
  ShoppingCart,
  Receipt,
  Loader2,
  X,
  Calendar,
  Tag,
  IndianRupee,
  Sparkles,
  Save,
} from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useExpenses, useMutations } from "@/context/DataContext";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  note: string | null;
  date: string;
}

const CATEGORY_ICONS: Record<string, typeof ShoppingCart> = {
  Food: Utensils,
  Rent: Home,
  Transport: Car,
  Utilities: Zap,
  Shopping: Shirt,
  Travel: Plane,
  Education: GraduationCap,
  Entertainment: Film,
  Gift: Gift,
  Other: ShoppingCart,
};

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] || ShoppingCart;
}

function formatCurrency(n: number) {
  return `\u20B9${n.toLocaleString("en-IN")}`;
}

export default function ExpensesPage() {
  const { toast, confirm } = useUI();

  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: expenses, loading, error, refetch } = useExpenses(currentMonth);
  const mutations = useMutations();

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    category: "Needs",
    subcategory: "",
    note: "",
    date: "",
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showMobileSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showMobileSearch]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const expenseList = expenses as Expense[] | undefined;
  const filteredExpenses = useMemo(() => {
    return (expenseList || []).filter(
      (exp: Expense) =>
        exp.subcategory.toLowerCase().includes(search.toLowerCase()) ||
        (exp.note && exp.note.toLowerCase().includes(search.toLowerCase()))
    );
  }, [expenseList, search]);

  const monthTotal = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + e.amount, 0);
  }, [filteredExpenses]);

  function openDetail(expense: Expense) {
    setSelectedExpense(expense);
    setForm({
      amount: expense.amount.toString(),
      category: expense.category,
      subcategory: expense.subcategory,
      note: expense.note || "",
      date: expense.date.split("T")[0],
    });
    setDeleting(false);
    setShowDetail(true);
  }

  function closeDetail() {
    setShowDetail(false);
    setSelectedExpense(null);
    setSaving(false);
    setDeleting(false);
  }

  async function handleSave() {
    if (!selectedExpense) return;
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!form.subcategory.trim()) {
      toast.error("Enter a subcategory");
      return;
    }
    if (!form.date) {
      toast.error("Select a date");
      return;
    }

    setSaving(true);
    try {
      await mutations.updateExpense(selectedExpense.id, {
        amount,
        category: form.category,
        subcategory: form.subcategory.trim(),
        note: form.note,
        date: form.date,
      });
      toast.success("Expense updated");
      closeDetail();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedExpense) return;
    const ok = await confirm({
      title: "Delete Transaction?",
      message: "This action cannot be undone.",
      confirmText: "Yes, Delete",
      cancelText: "Keep it",
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await mutations.deleteExpense(selectedExpense.id);
      toast.success("Transaction deleted");
      closeDetail();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
      setDeleting(false);
    }
  }

  const monthName = new Date(currentMonth + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const needsTotal = filteredExpenses.filter((e) => e.category === "Needs").reduce((s, e) => s + e.amount, 0);
  const wantsTotal = filteredExpenses.filter((e) => e.category === "Wants").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto space-y-4 pb-24 px-4">
      {/* Sticky Header */}
      <div className="-mx-4 px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-foreground">{formatCurrency(monthTotal)}</div>
            <div className="text-[11px] text-muted">
              {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedExpense(null);
              setForm({
                amount: "",
                category: "Needs",
                subcategory: "",
                note: "",
                date: new Date().toISOString().split("T")[0],
              });
              setShowDetail(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Search + Nav */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface border border-border-subtle rounded-xl overflow-hidden flex-shrink-0">
            <button onClick={() => changeMonth(-1)} className="p-2 text-muted hover:text-foreground hover:bg-surface-variant transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 text-muted hover:text-foreground hover:bg-surface-variant transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {showMobileSearch ? (
              <div className="flex items-center gap-2">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
                />
                <button onClick={() => { setSearch(""); setShowMobileSearch(false); }} className="p-2 text-muted hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMobileSearch(true)}
                className="w-full flex items-center gap-2 bg-surface border border-border-subtle rounded-xl px-3 py-2 text-sm text-muted hover:text-foreground hover:border-border-hover transition-colors text-left"
              >
                <Search size={14} />
                <span className="truncate">{search || "Search..."}</span>
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-muted whitespace-nowrap px-1">{monthName}</span>
        </div>
      </div>

      {/* Needs vs Wants mini bar */}
      {(filteredExpenses.length > 0 && !search) && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-1.5 rounded-full bg-surface-variant overflow-hidden flex">
            {needsTotal + wantsTotal > 0 && (
              <>
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${(needsTotal / (needsTotal + wantsTotal)) * 100}%` }}
                />
                <div
                  className="h-full bg-tertiary-500 transition-all"
                  style={{ width: `${(wantsTotal / (needsTotal + wantsTotal)) * 100}%` }}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-medium text-muted">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Needs</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-500" /> Wants</span>
          </div>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="animate-spin mb-3" size={24} />
          <span className="text-xs font-medium">Loading...</span>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center mb-4">
            <Receipt size={24} className="text-muted" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {search ? "No matching transactions" : "No expenses yet"}
          </p>
          <p className="text-xs text-muted mb-5 max-w-[220px]">
            {search ? "Try a different search term" : "Tap the button above to add your first expense"}
          </p>
          {!search && (
            <button
              onClick={() => openDetail({ id: "", amount: 0, category: "Needs", subcategory: "", note: "", date: new Date().toISOString() })}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl"
            >
              <Plus size={16} /> Add Expense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(() => {
            const groups: Record<string, Expense[]> = {};
            filteredExpenses.forEach((exp) => {
              const key = exp.date.split("T")[0];
              if (!groups[key]) groups[key] = [];
              groups[key].push(exp);
            });

            return Object.entries(groups).map(([dateKey, items]) => {
              const dayTotal = items.reduce((s, e) => s + e.amount, 0);
              const d = new Date(dateKey);
              const isToday = d.toDateString() === new Date().toDateString();
              const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString();
              const label = isToday ? "Today" : isYesterday ? "Yesterday" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

              return (
                <div key={dateKey}>
                  <div className="flex items-center justify-between px-1 py-2">
                    <span className="text-xs font-semibold text-muted">{label}</span>
                    <span className="text-xs font-semibold text-foreground">{formatCurrency(dayTotal)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((expense) => {
                      const Icon = getCategoryIcon(expense.subcategory);
                      return (
                        <motion.button
                          key={expense.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => openDetail(expense)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-subtle hover:border-border-hover hover:bg-surface-variant/30 transition-all text-left active:scale-[0.98]"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            expense.category === "Needs" ? "bg-primary-500/10 text-primary-500" : "bg-tertiary-500/10 text-tertiary-500"
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground truncate">{expense.subcategory}</span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                                expense.category === "Needs" ? "bg-primary-500/10 text-primary-500" : "bg-tertiary-500/10 text-tertiary-500"
                              }`}>
                                {expense.category}
                              </span>
                            </div>
                            {expense.note && (
                              <p className="text-xs text-muted truncate mt-0.5">{expense.note}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(expense.amount)}</span>
                            <Pencil size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Detail / Edit Bottom Sheet */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border-subtle max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-surface z-10">
                <div className="w-10 h-1 rounded-full bg-border-subtle" />
              </div>

              {selectedExpense && selectedExpense.id ? (
                /* EDIT MODE */
                <div className="px-5 pt-2 pb-8 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                        <Pencil size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">Edit Transaction</h2>
                    </div>
                    <button onClick={closeDetail} className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center text-muted hover:text-foreground transition-colors active:scale-95">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="relative">
                      <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-lg font-bold text-foreground outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category Toggle */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Category</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-surface-variant rounded-xl">
                      {["Needs", "Wants"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setForm({ ...form, category: type })}
                          className={`py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            form.category === type
                              ? "bg-primary-500 text-white shadow-sm"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          {type === "Needs" ? <ShoppingCart size={14} /> : <Sparkles size={14} />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategory */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Subcategory</label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={form.subcategory}
                        onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Note</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={2}
                      placeholder="Add a note..."
                      className="w-full bg-background border border-border-subtle rounded-xl py-3 px-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-error font-medium text-sm hover:bg-error/5 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {deleting ? "Deleting..." : "Delete Transaction"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ADD NEW EXPENSE MODE */
                <div className="px-5 pt-2 pb-8 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                        <Plus size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">New Expense</h2>
                    </div>
                    <button onClick={closeDetail} className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center text-muted hover:text-foreground transition-colors active:scale-95">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="relative">
                      <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        autoFocus
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-lg font-bold text-foreground outline-none focus:border-primary-500 transition-colors placeholder:text-muted"
                      />
                    </div>
                  </div>

                  {/* Category Toggle */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Category</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-surface-variant rounded-xl">
                      {["Needs", "Wants"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setForm({ ...form, category: type })}
                          className={`py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            form.category === type
                              ? "bg-primary-500 text-white shadow-sm"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          {type === "Needs" ? <ShoppingCart size={14} /> : <Sparkles size={14} />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategory */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Subcategory</label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={form.subcategory}
                        onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                        placeholder="e.g. Groceries, Rent, Uber"
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors placeholder:text-muted"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Note</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={2}
                      placeholder="Add a note..."
                      className="w-full bg-background border border-border-subtle rounded-xl py-3 px-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors resize-none placeholder:text-muted"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={async () => {
                      const amount = parseFloat(form.amount);
                      if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
                      if (!form.subcategory.trim()) { toast.error("Enter a subcategory"); return; }
                      if (!form.date) { toast.error("Select a date"); return; }

                      setSaving(true);
                      try {
                        await mutations.createExpense({
                          amount,
                          category: form.category,
                          subcategory: form.subcategory.trim(),
                          note: form.note,
                          date: form.date,
                        });
                        toast.success("Expense recorded!");
                        closeDetail();
                      } catch (e: any) {
                        toast.error(e.message || "Failed to save");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Add Expense"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB for mobile */}
      <button
        onClick={() => {
          setSelectedExpense(null);
          setForm({
            amount: "",
            category: "Needs",
            subcategory: "",
            note: "",
            date: new Date().toISOString().split("T")[0],
          });
          setShowDetail(true);
        }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
