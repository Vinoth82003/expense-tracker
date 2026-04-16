"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ReceiptIndianRupee, 
  Search, 
  Filter, 
  MoreVertical,
  CalendarDays,
  Tag,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  note: string | null;
  date: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?month=${currentMonth}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    
    // Listen for global expense added events
    const handleRefresh = () => fetchExpenses();
    window.addEventListener('expenseAdded', handleRefresh);
    return () => window.removeEventListener('expenseAdded', handleRefresh);
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.subcategory.toLowerCase().includes(search.toLowerCase()) || 
    (exp.note && exp.note.toLowerCase().includes(search.toLowerCase()))
  );

  const monthName = new Date(currentMonth + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-surface border border-border-subtle p-2 rounded-2xl shadow-sm">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-3 rounded-xl hover:bg-surface-variant transition-colors text-secondary"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-black tracking-tight">{monthName}</div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-3 rounded-xl hover:bg-surface-variant transition-colors text-secondary"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface border border-border-subtle rounded-2xl focus:outline-none focus:border-primary-500 transition-colors shadow-sm font-medium"
            />
          </div>
          
          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-border-subtle rounded-2xl text-secondary hover:text-foreground transition-colors shadow-sm font-bold">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 border-b border-border-subtle flex items-center justify-between bg-surface-variant/20">
          <h2 className="text-xl font-black flex items-center gap-2">
            <ReceiptIndianRupee size={24} className="text-primary-500" />
            Transactions
          </h2>
          <span className="text-xs font-black text-secondary bg-surface-variant px-3 py-1.5 rounded-full uppercase tracking-wider">
            {filteredExpenses.length} Total
          </span>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary font-bold animate-pulse">Updating history...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center mb-6 text-muted">
              <ReceiptIndianRupee size={32} />
            </div>
            <h3 className="text-xl font-black mb-2">Clean slate!</h3>
            <p className="text-secondary max-w-[240px] font-medium">
              {search ? "No matches found for that search." : "You haven't spent anything this month."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/50">
            {filteredExpenses.map((expense, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                key={expense.id} 
                className="p-5 sm:p-8 hover:bg-surface-variant/30 transition-all flex items-center justify-between group active:bg-surface-variant/50"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 ${
                    expense.category === "Needs" ? "bg-primary-500" : "bg-tertiary-500"
                  }`}>
                    {expense.subcategory.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="font-black text-lg sm:text-xl truncate leading-tight">{expense.subcategory}</h3>
                    <div className="flex items-center gap-3 text-sm text-secondary font-bold mt-1">
                      <span className="flex items-center gap-1 shrink-0 uppercase tracking-tight">
                        <CalendarDays size={14} className="text-muted" />
                        {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      {expense.note && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border-subtle shrink-0" />
                          <span className="truncate italic text-muted font-medium">{expense.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <div className="text-right">
                    <span className="block text-xl sm:text-2xl font-black tracking-tighter">
                      ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${
                      expense.category === "Needs" ? "bg-primary-50 text-primary-600" : "bg-tertiary-50 text-tertiary-600"
                    }`}>
                      {expense.category}
                    </span>
                  </div>
                  <button className="hidden sm:flex p-2 rounded-xl hover:bg-surface-variant text-muted hover:text-foreground transition-all">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
