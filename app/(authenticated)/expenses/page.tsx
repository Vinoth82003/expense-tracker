"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { 
  ReceiptIndianRupee, 
  Search, 
  Filter, 
  MoreVertical,
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Pencil,
  ArrowUpRight,
  Wallet,
  Target,
  ArrowDown
} from "lucide-react";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { TransactionDetailModal } from "@/components/ui/TransactionDetailModal";
import { useUI } from "@/context/UIContext";
import { Loader2, Eye } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  note: string | null;
  date: string;
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "range">("month");
  
  // Filtering state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });

  // Modal & Selection state
  const { toast, confirm } = useUI();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState<Expense | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchExpenses = async () => {
    // ... existing fetchExpenses logic ...
    setLoading(true);
    try {
      let query = "";
      if (viewMode === "month") {
        query = `?month=${currentMonth}`;
      } else {
        query = `?fromDate=${dateRange.from}&toDate=${dateRange.to}`;
      }
      
      const res = await fetch(`/api/expenses${query}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      toast.error("Failed to sync data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "month" || (dateRange.from && dateRange.to)) {
      fetchExpenses();
    }
    
    const handleRefresh = () => fetchExpenses();
    window.addEventListener('expenseAdded', handleRefresh);
    return () => window.removeEventListener('expenseAdded', handleRefresh);
  }, [currentMonth, viewMode, dateRange]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => 
      exp.subcategory.toLowerCase().includes(search.toLowerCase()) || 
      (exp.note && exp.note.toLowerCase().includes(search.toLowerCase()))
    );
  }, [expenses, search]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const limit = (session?.user as any)?.monthlyLimit || 0;
    const remaining = limit - total;
    const percentage = limit > 0 ? (total / limit) * 100 : 0;
    return { total, limit, remaining, percentage };
  }, [filteredExpenses, session]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
        title: "Delete Transaction?",
        message: "This action cannot be undone. This will permanently remove the record from your account.",
        confirmText: "Yes, Delete",
        cancelText: "Keep it",
        variant: "danger"
    });

    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Transaction deleted successfully");
        fetchExpenses();
        window.dispatchEvent(new CustomEvent('expenseAdded'));
      } else {
        toast.error("Failed to delete transaction");
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
      toast.error("An error occurred. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Category", "Subcategory", "Amount", "Note"];
    const rows = filteredExpenses.map(e => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.category,
      e.subcategory,
      e.amount,
      e.note || ""
    ]);
    
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SpendWise_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthName = new Date(currentMonth + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Summary Header - Pure Premium UX */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-5 sm:p-8 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none" />
         
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <div className="flex items-center gap-2 text-muted font-black uppercase tracking-[0.2em] text-xs mb-4">
                  <Wallet size={16} />
                  Usage Snapshot
               </div>
               <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-2">
                 ₹{stats.total.toLocaleString('en-IN')}
               </h2>
               <p className="text-secondary font-bold text-lg">
                 Total spent {viewMode === "month" ? "this month" : "in this period"}.
               </p>
            </div>

            <div className="space-y-6 bg-surface-variant p-6 rounded-[2rem] border border-border-subtle backdrop-blur-sm">
               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <span className="block text-xs font-black uppercase tracking-widest text-muted">Remaining Budget</span>
                     <span className={`text-3xl font-black ${stats.remaining < 0 ? 'text-error' : 'text-primary-500'}`}>
                       ₹{stats.remaining.toLocaleString('en-IN')}
                     </span>
                  </div>
                  <div className="text-right">
                     <span className="block text-xs font-black uppercase tracking-widest text-muted">Monthly Goal</span>
                     <span className="text-xl font-bold">₹{stats.limit.toLocaleString('en-IN')}</span>
                  </div>
               </div>

               <div className="relative w-full h-4 bg-background rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(stats.percentage, 100)}%` }}
                    className={`h-full rounded-full ${stats.percentage > 90 ? 'bg-error' : 'bg-primary-500'}`}
                  />
               </div>
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                  <span>0%</span>
                  <span>{Math.round(stats.percentage)}% Utilized</span>
                  <span>100%</span>
               </div>
            </div>
         </div>
      </section>

      {/* Advanced Filters Bar */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-6 shadow-sm space-y-4">
         <div className="w-full flex flex-wrap md:flex-nowrap items-center justify-between gap-4 border-b border-border-subtle/50 pb-4">
            <div className="w-full flex p-1 bg-surface-variant rounded-xl gap-1">
               <button 
                onClick={() => setViewMode("month")}
                className={`w-full px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                  viewMode === "month" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-secondary hover:text-foreground"
                }`}
               >
                 By Month
               </button>
               <button 
                onClick={() => setViewMode("range")}
                className={`w-full px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                  viewMode === "range" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-secondary hover:text-foreground"
                }`}
               >
                 Custom Range
               </button>
            </div>

            <div className="w-full flex items-center gap-2">
               <button 
                onClick={exportToCSV}
                className="w-full flex items-center gap-2 px-5 py-2.5 bg-surface-variant rounded-xl text-secondary hover:text-foreground font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-border-subtle active:scale-95"
               >
                 <Download size={16} />
                 Export
               </button>
               <button 
                onClick={() => {
                  setSelectedExpense(null);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
               >
                 <Plus size={16} />
                 Add entry
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            <div className="relative lg:col-span-1">
               <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
               <input 
                type="text" 
                placeholder="Search description or notes..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-variant/30 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-12 pr-4 font-bold focus:outline-none transition-all"
               />
            </div>

            <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-3">
               {viewMode === "month" ? (
                 <div className="flex items-center justify-between w-full bg-surface-variant/30 border border-border-subtle p-1.5 rounded-2xl">
                    <button onClick={() => changeMonth(-1)} className="p-3 text-secondary hover:text-foreground transition-colors"><ChevronLeft size={20} /></button>
                    <span className="font-black tracking-tight text-lg">{monthName}</span>
                    <button onClick={() => changeMonth(1)} className="p-3 text-secondary hover:text-foreground transition-colors"><ChevronRight size={20} /></button>
                 </div>
               ) : (
                 <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                       <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                       <input 
                        type="date" 
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="w-full bg-surface-variant/30 border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 font-black text-xs focus:outline-none focus:border-primary-500 transition-all uppercase"
                       />
                    </div>
                    <div className="w-4 h-0.5 bg-border-subtle" />
                    <div className="relative flex-1">
                       <input 
                        type="date" 
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="w-full bg-surface-variant/30 border border-border-subtle rounded-2xl py-3.5 px-4 font-black text-xs focus:outline-none focus:border-primary-500 transition-all uppercase"
                       />
                    </div>
                 </div>
               )}
            </div>
         </div>
      </section>

      {/* Expenses Table/List */}
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] shadow-sm">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-secondary uppercase tracking-widest text-xs">Crunching your data...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center mb-8 opacity-40">
                <ReceiptIndianRupee size={32} />
             </div>
             <h3 className="text-2xl font-black mb-2">Nothing here yet</h3>
             <p className="text-secondary font-medium max-w-[280px]">Adjust your filters or start adding new transactions to see them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/30">
            {filteredExpenses.map((expense, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                key={expense.id} 
                className={`p-5 sm:p-6 hover:bg-surface-variant/20 transition-all flex items-center gap-4 sm:gap-6 group ${
                  i === 0 ? "rounded-t-[2.5rem]" : ""
                } ${
                  i === filteredExpenses.length - 1 ? "rounded-b-[2.5rem]" : ""
                }`}
              >
                {/* 1. Icon Column */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg flex-shrink-0 ${
                  expense.category === "Needs" ? "bg-primary-500" : "bg-tertiary-500"
                }`}>
                  {expense.subcategory.charAt(0).toUpperCase()}
                </div>
                
                {/* 2. Text Info Column (Flexible) */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 mb-1">
                    <h3 className="font-black text-base sm:text-xl leading-tight group-hover:text-primary-600 transition-colors truncate">
                      {expense.subcategory}
                    </h3>
                    <span className={`w-fit text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${
                      expense.category === "Needs" 
                        ? "bg-primary-50 text-primary-600" 
                        : "bg-tertiary-50 text-tertiary-600"
                    }`}>
                      {expense.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-secondary">
                    <span className="flex items-center gap-1 shrink-0 font-black text-[10px] sm:text-xs">
                      <CalendarDays size={12} className="text-muted" />
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {expense.note && (
                      <>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-border-subtle shrink-0" />
                        <p className="w-full sm:w-auto italic text-muted font-medium normal-case first-letter:uppercase text-[11px] sm:text-xs truncate sm:break-words leading-relaxed">
                          {expense.note}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Amount + Menu Column (Fixed stability) */}
                <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4 min-w-[90px] sm:min-w-[120px] justify-end">
                  <div className="text-right">
                    <span className="block text-xl sm:text-3xl font-black leading-none tracking-tighter">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="relative flex-shrink-0">
                    <button 
                      disabled={deletingId === expense.id}
                      onClick={() => setActiveMenuId(activeMenuId === expense.id ? null : expense.id)}
                      className="p-3 rounded-xl hover:bg-surface-variant text-secondary transition-all active:scale-95 disabled:opacity-50"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <MoreVertical size={20} />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {activeMenuId === expense.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenuId(null)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: viewMode === "month" ? -10 : 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: viewMode === "month" ? -10 : 10 }}
                            className={`absolute right-0 w-48 bg-surface border border-border-subtle rounded-2xl shadow-2xl z-20 p-2 overflow-hidden ${
                              i >= filteredExpenses.length - 2
                                ? "bottom-full mb-2" 
                                : "top-full mt-2"
                            }`}
                          >

                            <button 
                              onClick={() => {
                                setDetailTransaction(expense);
                                setIsDetailModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant transition-colors font-bold text-sm"
                            >
                              <Eye size={18} className="text-muted" />
                              View Details
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedExpense(expense);
                                setIsModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant transition-colors font-bold text-sm"
                            >
                              <Pencil size={18} className="text-primary-500" />
                              Edit Item
                            </button>
                            <button 
                              onClick={() => {
                                handleDelete(expense.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-error/10 text-error transition-colors font-bold text-sm"
                            >
                              <Trash2 size={18} />
                              Delete Item
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="w-full h-[50px]"></div>

      <AddExpenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        editExpense={selectedExpense}
      />
      <TransactionDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={detailTransaction}
        type="expense"
      />
    </div>
  );
}
