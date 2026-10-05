"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { useExpenses } from "@/context/DataContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import SubcategoryPicker from "@/components/expenses/SubcategoryPicker";
import EntrySourceBadge from "@/components/transactions/EntrySourceBadge";
import TransactionFilterBar from "@/components/transactions/TransactionFilterBar";
import GroupByControl from "@/components/transactions/GroupByControl";
import CollapsibleGroup, {
  ExpandCollapseAll,
} from "@/components/transactions/CollapsibleGroup";
import {
  EMPTY_FILTERS,
  applyFilters,
  collectFacets,
  groupOptionsFor,
  groupTransactions,
  isFilterActive,
  sumAmount,
  type GroupKey,
  type TransactionFilters,
} from "@/lib/transaction-grouping";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  note: string | null;
  date: string;
  /** "MANUAL" | "SAGE"; absent on rows written before the field existed. */
  entrySource?: string | null;
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

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: expenses, loading } = useExpenses(currentMonth);
  const user = useUser();

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

  const [filters, setFilters] = useState<TransactionFilters>({ ...EMPTY_FILTERS });
  const [groupBy, setGroupBy] = useState<GroupKey>("date");
  const groupOptions = useMemo(() => groupOptionsFor("expense"), []);

  // Per-group open/closed state, keyed by group key. A missing key means
  // "expanded", so a group that appears later (or after switching the grouping
  // dimension) starts open instead of arriving silently collapsed.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isGroupExpanded = useCallback(
    (key: string) => expandedGroups[key] ?? true,
    [expandedGroups]
  );

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }, []);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const expenseList = useMemo<Expense[]>(
    () => (expenses as Expense[] | undefined) ?? [],
    [expenses]
  );

  // Facets come from the whole month, not the filtered set, so the dropdowns
  // keep offering values that the current filter selection excludes.
  const facets = useMemo(() => collectFacets(expenseList), [expenseList]);

  const filteredExpenses = useMemo(
    () => applyFilters(expenseList, filters),
    [expenseList, filters]
  );

  const groups = useMemo(
    () => groupTransactions(filteredExpenses, groupBy, "expense"),
    [filteredExpenses, groupBy]
  );

  // Defined after `groups` on purpose: these read it during the first render
  // pass, so hoisting them above the memo would hit the temporal dead zone.
  const allExpanded = useMemo(
    () => groups.every((g) => expandedGroups[g.key] ?? true),
    [groups, expandedGroups]
  );

  const toggleAllGroups = useCallback(() => {
    setExpandedGroups((prev) => {
      const collapseAll = groups.every((g) => prev[g.key] ?? true);
      return Object.fromEntries(groups.map((g) => [g.key, !collapseAll]));
    });
  }, [groups]);

  const monthTotal = useMemo(() => sumAmount(filteredExpenses), [filteredExpenses]);

  // While the edit sheet is open: Escape closes it, and the page behind it must
  // not scroll away under the overlay.
  useEffect(() => {
    if (!showDetail) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showDetail]);

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
      await user.updateExpense(selectedExpense.id, {
        amount,
        category: form.category,
        subcategory: form.subcategory.trim(),
        note: form.note,
        date: form.date,
      });
      toast.success("Expense updated");
      closeDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
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
      await user.deleteExpense(selectedExpense.id);
      toast.success("Transaction deleted");
      closeDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  }

  const monthName = new Date(currentMonth + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const needsTotal = filteredExpenses.filter((e) => e.category === "Needs").reduce((s, e) => s + e.amount, 0);
  const wantsTotal = filteredExpenses.filter((e) => e.category === "Wants").reduce((s, e) => s + e.amount, 0);
  const filtersActive = isFilterActive(filters);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-24">
      {/* ------------------------------------------------------------------
          Header. One clear focal point: what was spent this month. Everything
          else (count, month, add action) is subordinate to that number, so it
          is the largest type on the page and nothing competes with it.
         ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-border-subtle bg-background/90 px-4 pb-3 pt-2 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Expenses
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <h1 className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {formatCurrency(monthTotal)}
              </h1>
            </div>
            <p className="mt-0.5 text-xs font-medium text-muted" aria-live="polite">
              {loading
                ? "Loading…"
                : `${filteredExpenses.length} transaction${
                    filteredExpenses.length === 1 ? "" : "s"
                  }${filtersActive ? " matched" : ""}`}
            </p>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-add-expense"))}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
            <span className="sr-only sm:hidden">Add expense</span>
          </button>
        </div>

        {/* Month navigation. The month is a label for the whole view, so it sits
            between the stepper and the group control on a single row. */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-shrink-0 items-center overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="p-2 text-muted transition-colors hover:bg-surface-variant hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="border-l border-border-subtle p-2 text-muted transition-colors hover:bg-surface-variant hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold text-foreground">
            {monthName}
          </span>

          <ExpandCollapseAll
            allExpanded={allExpanded}
            onToggleAll={toggleAllGroups}
            hidden={groups.length < 2}
          />

          <GroupByControl
            value={groupBy}
            options={groupOptions}
            onChange={setGroupBy}
            groupCount={groups.length}
          />
        </div>
      </header>

      {/* Search + filters */}
      <TransactionFilterBar
        filters={filters}
        onChange={setFilters}
        facets={facets}
        kind="expense"
        resultCount={filteredExpenses.length}
      />

      {/* Needs vs Wants. Labelled as a figure with a text alternative, since the
          bar alone is unreadable to anyone who cannot map the two hues. */}
      {filteredExpenses.length > 0 && (
        <section
          aria-label="Needs versus wants split"
          className="rounded-2xl border border-border-subtle bg-surface p-3"
        >
          <div
            className="flex h-2 overflow-hidden rounded-full bg-surface-variant"
            role="img"
            aria-label={`Needs ${formatCurrency(needsTotal)}, Wants ${formatCurrency(wantsTotal)}`}
          >
            {needsTotal + wantsTotal > 0 && (
              <>
                <div
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${(needsTotal / (needsTotal + wantsTotal)) * 100}%` }}
                />
                <div
                  className="h-full bg-tertiary-500 transition-all duration-500"
                  style={{ width: `${(wantsTotal / (needsTotal + wantsTotal)) * 100}%` }}
                />
              </>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-4 text-[11px] font-medium text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              Needs
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(needsTotal)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-tertiary-500" />
              Wants
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(wantsTotal)}
              </span>
            </span>
          </div>
        </section>
      )}

      {/* Expense List */}
      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center py-20 text-muted"
        >
          <Loader2 className="mb-3 animate-spin" size={24} />
          <span className="text-xs font-medium">Loading expenses…</span>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-variant">
            <Receipt size={24} className="text-muted" />
          </div>
          <p className="mb-1 text-sm font-semibold text-foreground">
            {filtersActive ? "No matching transactions" : "No expenses yet"}
          </p>
          <p className="mb-5 max-w-[220px] text-xs text-muted">
            {filtersActive
              ? "No expenses match your filters. Try widening the date or amount range."
              : "Tap the button above to add your first expense"}
          </p>
          {filtersActive ? (
            <button
              onClick={() => setFilters({ ...EMPTY_FILTERS })}
              className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <X size={16} /> Clear filters
            </button>
          ) : (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-add-expense"))}
              className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Plus size={16} /> Add Expense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <CollapsibleGroup
              key={group.key}
              groupKey={group.key}
              label={group.label}
              totalLabel={formatCurrency(group.total)}
              countLabel={`${group.count} item${group.count === 1 ? "" : "s"}`}
              expanded={isGroupExpanded(group.key)}
              onToggle={() => toggleGroup(group.key)}
            >
              {group.items.map((expense) => {
                const Icon = getCategoryIcon(expense.subcategory);
                return (
                  <li key={expense.id}>
                    <button
                      onClick={() => openDetail(expense)}
                      className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-variant/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 active:bg-surface-variant/60"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                          expense.category === "Needs"
                            ? "bg-primary-500/10 text-primary-500"
                            : "bg-tertiary-500/10 text-tertiary-500"
                        )}
                      >
                        <Icon size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {expense.subcategory}
                          </span>
                          {groupBy !== "category" && (
                            <span
                              className={cn(
                                "flex-shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
                                expense.category === "Needs"
                                  ? "bg-primary-500/10 text-primary-500"
                                  : "bg-tertiary-500/10 text-tertiary-500"
                              )}
                            >
                              {expense.category}
                            </span>
                          )}
                          <EntrySourceBadge value={expense.entrySource} />
                        </div>
                        {/* When grouping by date the group header already carries
                            it, so the row falls back to the note alone. */}
                        {groupBy === "date" && expense.note ? (
                          <p className="mt-0.5 truncate text-xs text-muted">{expense.note}</p>
                        ) : null}
                      </div>

                      <span className="flex-shrink-0 text-sm font-bold tabular-nums text-foreground">
                        {formatCurrency(expense.amount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </CollapsibleGroup>
          ))}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-transaction-title"
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

              <div className="px-5 pt-2 pb-8 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                      <Pencil size={18} />
                    </div>
                    <div>
                      <h2 id="edit-transaction-title" className="text-lg font-bold text-foreground">Edit Transaction</h2>
                      <EntrySourceBadge
                        value={selectedExpense?.entrySource}
                        className="mt-0.5"
                      />
                    </div>
                  </div>
                  <button
                    onClick={closeDetail}
                    aria-label="Close edit transaction"
                    className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center text-muted hover:text-foreground transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Amount */}
                <div className="mb-6">
                  <label htmlFor="edit-amount" className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Amount</label>
                  <div className="relative">
                    <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="edit-amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-lg font-bold text-foreground outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Needs/Wants. A radiogroup rather than two buttons: this is one
                    choice with two options, so assistive tech should say so. */}
                <div className="mb-6">
                  <div
                    role="radiogroup"
                    aria-label="Category"
                    className="grid grid-cols-2 gap-2 p-1 bg-surface-variant rounded-xl"
                  >
                    {["Needs", "Wants"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={form.category === type}
                        onClick={() =>
                          setForm({ ...form, category: type, subcategory: "" })
                        }
                        className={cn(
                          "py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                          form.category === type
                            ? "bg-primary-500 text-white shadow-sm"
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        {type === "Needs" ? <ShoppingCart size={14} /> : <Sparkles size={14} />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory */}
                <div className="mb-6">
                  <label htmlFor="edit-subcategory" className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Subcategory</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-4 top-4 text-muted pointer-events-none z-10" />
                    <SubcategoryPicker
                      id="edit-subcategory"
                      type={form.category}
                      value={form.subcategory}
                      onChange={(name) => setForm({ ...form, subcategory: name })}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="mb-6">
                  <label htmlFor="edit-date" className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="edit-date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="mb-6">
                  <label htmlFor="edit-note" className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">Note</label>
                  <textarea
                    id="edit-note"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB for mobile */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-add-expense"))}
        aria-label="Add expense"
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center active:scale-90 transition-transform z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
