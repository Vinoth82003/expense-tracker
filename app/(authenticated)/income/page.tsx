"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { 
  Banknote, 
  Search, 
  Plus, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Trash2, 
  Pencil, 
  MoreVertical,
  Briefcase,
  TrendingUp,
  Gift,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import { AddIncomeModal } from "@/components/income/AddIncomeModal";
import { useUI } from "@/context/UIContext";
import { Loader2 } from "lucide-react";

interface Income {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  date: string;
}

const SOURCE_ICONS: Record<string, any> = {
  Salary: Briefcase,
  Freelance: TrendingUp,
  Investment: Banknote,
  Gift: Gift,
  Others: Sparkles,
};

export default function IncomePage() {
  const { data: session } = useSession();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "range">("month");
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const { toast, confirm } = useUI();
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      let query = "";
      if (viewMode === "month") {
        query = `?month=${currentMonth}`;
      } else {
        query = `?fromDate=${dateRange.from}&toDate=${dateRange.to}`;
      }
      
      const res = await fetch(`/api/income${query}`);
      const data = await res.json();
      setIncomes(data.incomes || []);
    } catch (error) {
      console.error("Failed to fetch incomes:", error);
      toast.error("Failed to sync earnings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "month" || (dateRange.from && dateRange.to)) {
      fetchIncomes();
    }
    
    const handleRefresh = () => fetchIncomes();
    window.addEventListener('incomeAdded', handleRefresh);
    return () => window.removeEventListener('incomeAdded', handleRefresh);
  }, [currentMonth, viewMode, dateRange]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => 
      inc.source.toLowerCase().includes(search.toLowerCase()) || 
      (inc.note && inc.note.toLowerCase().includes(search.toLowerCase()))
    );
  }, [incomes, search]);

  const stats = useMemo(() => {
    const total = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const count = filteredIncomes.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [filteredIncomes]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
        title: "Remove Earnings Entry?",
        message: "This will permanently delete this income record. This action cannot be undone.",
        confirmText: "Yes, Delete",
        cancelText: "Cancel",
        variant: "danger"
    });

    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Income record removed");
        fetchIncomes();
        window.dispatchEvent(new CustomEvent('incomeAdded'));
      } else {
        toast.error("Failed to delete record");
      }
    } catch (err) {
      console.error("Failed to delete income:", err);
      toast.error("An error occurred. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Source", "Amount", "Note"];
    const rows = filteredIncomes.map(i => [
      new Date(i.date).toLocaleDateString('en-IN'),
      i.source,
      i.amount,
      i.note || ""
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SpendWise_Income_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthName = new Date(currentMonth + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Income Summary Header */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 sm:p-10 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-success/5 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none" />
         
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <div className="flex items-center gap-2 text-success font-black uppercase tracking-[0.2em] text-xs mb-4">
                  <Banknote size={16} />
                  Total Earnings
               </div>
               <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-2 text-success">
                 ₹{stats.total.toLocaleString('en-IN')}
               </h2>
               <p className="text-secondary font-bold text-lg">
                 Total income {viewMode === "month" ? "this month" : "in this period"}.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-variant/50 p-6 rounded-[2rem] border border-border-subtle backdrop-blur-sm">
                <span className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Transactions</span>
                <span className="text-3xl font-black">{stats.count}</span>
              </div>
              <div className="bg-surface-variant/50 p-6 rounded-[2rem] border border-border-subtle backdrop-blur-sm">
                <span className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Average Entry</span>
                <span className="text-2xl font-black">₹{Math.round(stats.avg).toLocaleString('en-IN')}</span>
              </div>
            </div>
         </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-6 shadow-sm space-y-4">
         <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 border-b border-border-subtle/50 pb-4">
            <div className="flex w-full p-1 bg-surface-variant rounded-xl gap-1">
               <button 
                onClick={() => setViewMode("month")}
                className={`w-full px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                  viewMode === "month" ? "bg-success text-white shadow-lg shadow-success/20" : "text-secondary hover:text-foreground"
                }`}
               >
                 By Month
               </button>
               <button 
                onClick={() => setViewMode("range")}
                className={`w-full px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                  viewMode === "range" ? "bg-success text-white shadow-lg shadow-success/20" : "text-secondary hover:text-foreground"
                }`}
               >
                 Custom Range
               </button>
            </div>

            <div className="flex w-full items-center gap-2">
               <button 
                onClick={exportToCSV}
                className="w-full flex items-center gap-2 px-5 py-2.5 bg-surface-variant rounded-xl text-secondary hover:text-foreground font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-border-subtle active:scale-95"
               >
                 <Download size={16} />
                 Export
               </button>
               <button 
                onClick={() => {
                  setSelectedIncome(null);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 shadow-lg shadow-success/10"
               >
                 <Plus size={16} />
                 Add Income
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            <div className="relative lg:col-span-1">
               <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
               <input 
                type="text" 
                placeholder="Search sources or notes..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-variant/30 border-2 border-transparent focus:border-success rounded-2xl py-4 pl-12 pr-4 font-bold focus:outline-none transition-all"
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
                        className="w-full bg-surface-variant/30 border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 font-black text-xs focus:outline-none focus:border-success transition-all uppercase"
                       />
                    </div>
                    <div className="w-4 h-0.5 bg-border-subtle" />
                    <div className="relative flex-1">
                       <input 
                        type="date" 
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="w-full bg-surface-variant/30 border border-border-subtle rounded-2xl py-3.5 px-4 font-black text-xs focus:outline-none focus:border-success transition-all uppercase"
                       />
                    </div>
                 </div>
               )}
            </div>
         </div>
      </section>

      {/* Income List */}
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] shadow-sm">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-success border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-secondary uppercase tracking-widest text-xs">Syncing your earnings...</p>
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-8">
                <Banknote size={32} />
             </div>
             <h3 className="text-2xl font-black mb-2">No income entries</h3>
             <p className="text-secondary font-medium max-w-[280px]">Start tracking your earnings to see your financial growth.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/30">
            {filteredIncomes.map((income, i) => {
              const Icon = SOURCE_ICONS[income.source] || Sparkles;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  key={income.id} 
                  className={`p-6 sm:p-8 hover:bg-success/5 transition-all flex items-center justify-between group ${
                    i === 0 ? "rounded-t-[2.5rem]" : ""
                  } ${
                    i === filteredIncomes.length - 1 ? "rounded-b-[2.5rem]" : ""
                  }`}
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 bg-success">
                      <Icon size={24} />
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="font-black text-lg sm:text-xl truncate leading-tight group-hover:text-success transition-colors">{income.source}</h3>
                      <div className="flex items-center gap-3 text-xs text-secondary font-bold mt-1.5 uppercase tracking-tight">
                        <span className="flex items-center gap-1 shrink-0 font-black">
                          <CalendarDays size={12} className="text-muted" />
                          {new Date(income.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {income.note && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border-subtle shrink-0" />
                            <span className="truncate italic text-muted font-medium lowercase first-letter:uppercase">{income.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 relative">
                    <div className="text-right">
                      <span className="block text-xl sm:text-3xl font-black leading-none tracking-tighter text-success">
                        ₹{income.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md mt-1 inline-block bg-success/10 text-success">
                         Deposited
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="relative">
                      <button 
                        disabled={deletingId === income.id}
                        onClick={() => setActiveMenuId(activeMenuId === income.id ? null : income.id)}
                        className="p-3 rounded-xl hover:bg-surface-variant text-secondary transition-all active:scale-95 disabled:opacity-50"
                      >
                        {deletingId === income.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <MoreVertical size={20} />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {activeMenuId === income.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className={`absolute right-0 w-48 bg-surface border border-border-subtle rounded-2xl shadow-2xl z-20 p-2 overflow-hidden ${
                                i >= filteredIncomes.length - 2
                                  ? "bottom-full mb-2" 
                                  : "top-full mt-2"
                              }`}
                            >
                              <button 
                                onClick={() => {
                                  setSelectedIncome(income);
                                  setIsModalOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant transition-colors font-bold text-sm"
                              >
                                <Pencil size={18} className="text-success" />
                                Edit Entry
                              </button>
                              <button 
                                onClick={() => {
                                  handleDelete(income.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-error/10 text-error transition-colors font-bold text-sm"
                              >
                                <Trash2 size={18} />
                                Delete Entry
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AddIncomeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncomes}
        editIncome={selectedIncome}
      />
    </div>
  );
}
