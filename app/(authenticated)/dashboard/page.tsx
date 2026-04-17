"use client";

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowUpRight, 
  Wallet, 
  ShoppingCart, 
  Activity,
  CalendarDays,
  PieChart as PieChartIcon,
  ArrowRight,
  TrendingUp,
  Banknote,
  Scale
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
}

interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const expenseMode = (session?.user as { expenseMode?: string })?.expenseMode;
  const monthlyLimit = (session?.user as { monthlyLimit?: number })?.monthlyLimit || 0;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    const fetchDashboardData = async () => {
      try {
        const currentDate = new Date();
        const monthFilter = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const [expRes, incRes] = await Promise.all([
          fetch(`/api/expenses?month=${monthFilter}`),
          fetch(`/api/income?month=${monthFilter}`)
        ]);

        const expData = await expRes.json();
        const incData = await incRes.json();

        setExpenses(expData.expenses || []);
        setIncomes(incData.incomes || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchDashboardData();
      
      const handleRefresh = () => fetchDashboardData();
      window.addEventListener('expenseAdded', handleRefresh);
      return () => window.removeEventListener('expenseAdded', handleRefresh);
    }
  }, [session]);

  const stats = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netBalance = totalIncome - totalSpent;

    const currentDate = new Date();
    const daysElapsed = currentDate.getDate() || 1;
    const dailyAverage = totalSpent / daysElapsed;
    const remaining = expenseMode === "limit" ? monthlyLimit - totalSpent : null;

    // Category breakdown for chart
    const catMap = new Map<string, number>();
    expenses.forEach(e => catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount));
    const chartData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

    return { totalSpent, totalIncome, netBalance, dailyAverage, remaining, chartData };
  }, [expenses, incomes, expenseMode, monthlyLimit]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <section>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-black text-xs tracking-widest uppercase mb-2">
              <Sparkles size={16} />
              Personal Finance Assistant
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none mb-2 break-words max-w-[90vw]">
              Hey {firstName}! 👋
            </h1>
            <p className="text-secondary font-bold text-base sm:text-lg">Your financial pulse for {new Date().toLocaleDateString('en-IN', { month: 'long' })}.</p>
          </div>
          
          <div className="flex items-center gap-2 text-foreground font-black bg-surface border border-border-subtle px-5 py-3 rounded-2xl shadow-sm">
            <CalendarDays size={18} className="text-primary-500" />
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </motion.div>
      </section>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wallet size={20} />
          </div>
          <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Spent</div>
          <div className="text-2xl font-black text-foreground">
            {loading ? "..." : `₹${stats.totalSpent.toLocaleString('en-IN')}`}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Banknote size={20} />
          </div>
          <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Income</div>
          <div className="text-2xl font-black text-foreground">
            {loading ? "..." : `₹${stats.totalIncome.toLocaleString('en-IN')}`}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 rounded-full ${stats.netBalance >= 0 ? "bg-success/5" : "bg-error/5"}`} />
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stats.netBalance >= 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
            <Scale size={20} />
          </div>
          <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Net Balance</div>
          <div className="text-2xl font-black text-foreground">
            {loading ? "..." : `₹${stats.netBalance.toLocaleString('en-IN')}`}
          </div>
        </motion.div>

        {expenseMode === "limit" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 rounded-full ${stats.remaining! >= 0 ? "bg-primary-500/5" : "bg-error/5"}`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stats.remaining! >= 0 ? "bg-primary-500/10 text-primary-500" : "bg-error/10 text-error"}`}>
              <Activity size={20} />
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Budget Left</div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : `₹${stats.remaining!.toLocaleString('en-IN')}`}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-muted/5 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="w-10 h-10 rounded-xl bg-surface-variant text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart size={20} />
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Daily Avg</div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : `₹${Math.round(stats.dailyAverage).toLocaleString('en-IN')}`}
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Recent Activity */}
        <div className="bg-surface rounded-[2.5rem] border border-border-subtle overflow-hidden flex flex-col shadow-sm">
          <div className="p-8 flex items-center justify-between border-b border-border-subtle">
            <h3 className="text-2xl font-black">Recent Activity</h3>
            <Link href="/expenses" className="text-sm font-black text-primary-500 hover:text-primary-600 flex items-center gap-1.5 px-4 py-2 bg-primary-500/5 rounded-full transition-colors">
              More <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex-1">
             {loading ? (
               <div className="p-12 text-center text-muted font-bold italic animate-pulse uppercase tracking-widest text-xs">Fetching transactions...</div>
             ) : expenses.length === 0 ? (
               <div className="p-12 text-center text-muted font-medium italic">
                 No expenses found for this month. 💸
               </div>
             ) : (
               <div className="divide-y divide-border-subtle">
                 {expenses.slice(0, 4).map((exp) => (
                   <div key={exp.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-surface-variant transition-colors group">
                     <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 ${
                       exp.category === "Needs" ? "bg-primary-500" : "bg-tertiary-500"
                     }`}>
                       {exp.subcategory.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="font-black text-base sm:text-lg truncate">{exp.subcategory}</h4>
                       <div className="text-[10px] text-muted font-black uppercase tracking-widest mt-0.5 truncate">
                         {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {exp.category}
                       </div>
                     </div>
                     <div className="flex-shrink-0 text-right">
                       <span className="font-black text-lg sm:text-xl">₹{exp.amount.toLocaleString('en-IN')}</span>
                     </div>
                   </div>
                 ))}
                 <Link href="/expenses" className="block text-center py-5 font-black text-xs uppercase tracking-widest text-secondary hover:text-primary-500 transition-colors bg-surface-variant/30">
                    See 10+ more transactions
                 </Link>
               </div>
             )}
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black">Category Split</h3>
            <Link href="/reports" className="text-primary-500">
               <TrendingUp size={24} />
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {loading ? (
               <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : expenses.length === 0 ? (
              <div className="text-center group cursor-pointer">
                 <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all">
                    <PieChartIcon size={32} className="text-muted" />
                 </div>
                 <p className="text-muted font-bold italic">No data to visualize yet</p>
              </div>
            ) : (
              <>
                <div className="h-64 sm:h-72 w-full mt-4 relative">
                  {mounted && !loading && stats.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '1rem', fontWeight: 'bold' }}
                          itemStyle={{ color: 'var(--foreground)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                  {stats.chartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-3 bg-surface-variant/30 p-2.5 sm:p-3 rounded-2xl border border-border-subtle">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase text-muted truncate">{entry.name}</p>
                        <p className="font-black text-sm sm:text-base">₹{entry.value.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
