"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Banknote,
  Briefcase,
  TrendingUp,
  Gift,
  Sparkles,
  Receipt,
  Loader2,
  X,
  Calendar,
  IndianRupee,
  Save,
} from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useDashboard } from "@/context/DashboardContext";

interface Income {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  date: string;
}

const SOURCE_ICONS: Record<string, typeof Banknote> = {
  Salary: Briefcase,
  Freelance: TrendingUp,
  Investment: Banknote,
  Gift: Gift,
  Others: Sparkles,
};

function getSourceIcon(name: string) {
  return SOURCE_ICONS[name] || Banknote;
}

function formatCurrency(n: number) {
  return `\u20B9${n.toLocaleString("en-IN")}`;
}

const INCOME_SOURCES = [
  { name: "Salary", icon: Briefcase },
  { name: "Freelance", icon: TrendingUp },
  { name: "Investment", icon: Banknote },
  { name: "Gift", icon: Gift },
  { name: "Others", icon: Sparkles },
];

export default function IncomePage() {
  const { incomes: contextIncomes, loading: contextLoading, refreshData: refreshContext } = useDashboard();
  const { toast, confirm } = useUI();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    source: "Salary",
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

  const fetchIncomes = async (month?: string) => {
    setLoading(true);
    try {
      const m = month || currentMonth;
      const res = await fetch(`/api/income?month=${m}`);
      const data = await res.json();
      setIncomes(data.incomes || []);
    } catch {
      toast.error("Failed to load income");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const actualCurrentMonth = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    if (currentMonth === actualCurrentMonth) {
      setIncomes(contextIncomes);
      setLoading(contextLoading);
    } else {
      fetchIncomes();
    }

    const handleRefresh = () => {
      if (currentMonth === actualCurrentMonth) {
        refreshContext();
      } else {
        fetchIncomes();
      }
    };

    window.addEventListener("incomeAdded", handleRefresh);
    window.addEventListener("expenseAdded", handleRefresh);
    return () => {
      window.removeEventListener("incomeAdded", handleRefresh);
      window.removeEventListener("expenseAdded", handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, contextIncomes, contextLoading]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const filteredIncomes = useMemo(() => {
    return incomes.filter(
      (inc) =>
        inc.source.toLowerCase().includes(search.toLowerCase()) ||
        (inc.note && inc.note.toLowerCase().includes(search.toLowerCase()))
    );
  }, [incomes, search]);

  const monthTotal = useMemo(() => {
    return filteredIncomes.reduce((s, i) => s + i.amount, 0);
  }, [filteredIncomes]);

  function openDetail(income: Income) {
    setSelectedIncome(income);
    setForm({
      amount: income.amount.toString(),
      source: income.source,
      note: income.note || "",
      date: income.date.split("T")[0],
    });
    setDeleting(false);
    setShowDetail(true);
  }

  function closeDetail() {
    setShowDetail(false);
    setSelectedIncome(null);
    setSaving(false);
    setDeleting(false);
  }

  async function handleSave() {
    if (!selectedIncome) return;
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!form.source) { toast.error("Select a source"); return; }
    if (!form.date) { toast.error("Select a date"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/income/${selectedIncome.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, source: form.source, note: form.note, date: form.date }),
      });
      if (res.ok) {
        toast.success("Income updated");
        window.dispatchEvent(new CustomEvent("incomeAdded"));
        closeDetail();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedIncome) return;
    const ok = await confirm({
      title: "Delete Income?",
      message: "This action cannot be undone.",
      confirmText: "Yes, Delete",
      cancelText: "Keep it",
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/income/${selectedIncome.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Income deleted");
        window.dispatchEvent(new CustomEvent("incomeAdded"));
        closeDetail();
      } else {
        toast.error("Failed to delete");
        setDeleting(false);
      }
    } catch {
      toast.error("An error occurred");
      setDeleting(false);
    }
  }

  const monthName = new Date(currentMonth + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto space-y-4 pb-24 px-4">
      {/* Sticky Header */}
      <div className="-mx-4 px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-foreground">{formatCurrency(monthTotal)}</div>
            <div className="text-[11px] text-muted">
              {filteredIncomes.length} income{filteredIncomes.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedIncome(null);
              setForm({
                amount: "",
                source: "Salary",
                note: "",
                date: new Date().toISOString().split("T")[0],
              });
              setShowDetail(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-success text-white text-sm font-semibold rounded-xl shadow-lg shadow-success/20 hover:bg-success/90 active:scale-95 transition-all"
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
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-sm outline-none focus:border-success transition-colors"
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

      {/* Income List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="animate-spin mb-3" size={24} />
          <span className="text-xs font-medium">Loading...</span>
        </div>
      ) : filteredIncomes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center mb-4">
            <Receipt size={24} className="text-muted" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {search ? "No matching income" : "No income yet"}
          </p>
          <p className="text-xs text-muted mb-5 max-w-[220px]">
            {search ? "Try a different search term" : "Track your earnings to see your financial growth"}
          </p>
          {!search && (
            <button
              onClick={() => {
                setSelectedIncome(null);
                setForm({ amount: "", source: "Salary", note: "", date: new Date().toISOString().split("T")[0] });
                setShowDetail(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-success text-white text-sm font-semibold rounded-xl"
            >
              <Plus size={16} /> Add Income
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(() => {
            const groups: Record<string, Income[]> = {};
            filteredIncomes.forEach((inc) => {
              const key = inc.date.split("T")[0];
              if (!groups[key]) groups[key] = [];
              groups[key].push(inc);
            });

            return Object.entries(groups).map(([dateKey, items]) => {
              const dayTotal = items.reduce((s, i) => s + i.amount, 0);
              const d = new Date(dateKey);
              const isToday = d.toDateString() === new Date().toDateString();
              const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString();
              const label = isToday ? "Today" : isYesterday ? "Yesterday" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

              return (
                <div key={dateKey}>
                  <div className="flex items-center justify-between px-1 py-2">
                    <span className="text-xs font-semibold text-muted">{label}</span>
                    <span className="text-xs font-semibold text-success">{formatCurrency(dayTotal)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((income) => {
                      const Icon = getSourceIcon(income.source);
                      return (
                        <motion.button
                          key={income.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => openDetail(income)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-subtle hover:border-border-hover hover:bg-surface-variant/30 transition-all text-left active:scale-[0.98]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground truncate">{income.source}</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-success/10 text-success">
                                Income
                              </span>
                            </div>
                            {income.note && (
                              <p className="text-xs text-muted truncate mt-0.5">{income.note}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-sm font-bold text-success tabular-nums">{formatCurrency(income.amount)}</span>
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

              {selectedIncome && selectedIncome.id ? (
                /* EDIT MODE */
                <div className="px-5 pt-2 pb-8 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                        <Pencil size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">Edit Income</h2>
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
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-lg font-bold text-foreground outline-none focus:border-success transition-colors"
                      />
                    </div>
                  </div>

                  {/* Source */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Source</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INCOME_SOURCES.map((src) => {
                        const isActive = form.source === src.name;
                        return (
                          <button
                            key={src.name}
                            onClick={() => setForm({ ...form, source: src.name })}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                              isActive
                                ? "border-success bg-success/5 text-foreground shadow-sm"
                                : "border-border-subtle bg-surface-variant/30 text-muted hover:text-foreground hover:border-border-hover"
                            }`}
                          >
                            <src.icon size={16} className={isActive ? "text-success" : ""} />
                            {src.name}
                          </button>
                        );
                      })}
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
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-success transition-colors"
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
                      className="w-full bg-background border border-border-subtle rounded-xl py-3 px-4 text-sm font-medium text-foreground outline-none focus:border-success transition-colors resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-success text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
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
                      {deleting ? "Deleting..." : "Delete Income"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ADD NEW INCOME */
                <div className="px-5 pt-2 pb-8 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                        <Plus size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">New Income</h2>
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
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-lg font-bold text-foreground outline-none focus:border-success transition-colors placeholder:text-muted"
                      />
                    </div>
                  </div>

                  {/* Source */}
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Source</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INCOME_SOURCES.map((src) => {
                        const isActive = form.source === src.name;
                        return (
                          <button
                            key={src.name}
                            onClick={() => setForm({ ...form, source: src.name })}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                              isActive
                                ? "border-success bg-success/5 text-foreground shadow-sm"
                                : "border-border-subtle bg-surface-variant/30 text-muted hover:text-foreground hover:border-border-hover"
                            }`}
                          >
                            <src.icon size={16} className={isActive ? "text-success" : ""} />
                            {src.name}
                          </button>
                        );
                      })}
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
                        className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-success transition-colors"
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
                      className="w-full bg-background border border-border-subtle rounded-xl py-3 px-4 text-sm font-medium text-foreground outline-none focus:border-success transition-colors resize-none placeholder:text-muted"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={async () => {
                      const amount = parseFloat(form.amount);
                      if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
                      if (!form.source) { toast.error("Select a source"); return; }
                      if (!form.date) { toast.error("Select a date"); return; }

                      setSaving(true);
                      try {
                        const res = await fetch("/api/income", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, source: form.source, note: form.note, date: form.date }),
                        });
                        if (res.ok) {
                          toast.success("Income recorded!");
                          window.dispatchEvent(new CustomEvent("incomeAdded"));
                          closeDetail();
                        } else {
                          const err = await res.json();
                          toast.error(err.error || "Failed to save");
                        }
                      } catch {
                        toast.error("An error occurred");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-success text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Add Income"}
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
          setSelectedIncome(null);
          setForm({ amount: "", source: "Salary", note: "", date: new Date().toISOString().split("T")[0] });
          setShowDetail(true);
        }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-success text-white shadow-xl shadow-success/30 flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
