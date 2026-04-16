"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowUpRight, 
  Wallet, 
  ShoppingCart, 
  Activity,
  CalendarDays,
  PieChart,
  ArrowRight
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const expenseMode = (session?.user as any)?.expenseMode;
  const monthlyLimit = (session?.user as any)?.monthlyLimit || 0;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const currentDate = new Date();
        const monthFilter = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const res = await fetch(`/api/expenses?month=${monthFilter}`);
        const data = await res.json();
        setExpenses(data.expenses || []);
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
    const currentDate = new Date();
    const daysElapsed = currentDate.getDate() || 1;
    const dailyAverage = totalSpent / daysElapsed;
    const remaining = expenseMode === "limit" ? monthlyLimit - totalSpent : null;

    return { totalSpent, dailyAverage, remaining };
  }, [expenses, expenseMode, monthlyLimit]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-widest uppercase mb-2">
              <Sparkles size={16} />
              Good to see you again
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-primary-500 to-tertiary-500 bg-clip-text text-transparent">{firstName}!</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-secondary font-medium bg-surface border border-border-subtle px-4 py-2 rounded-xl shadow-sm">
            <CalendarDays size={18} className="text-primary-500" />
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </motion.div>
      </section>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={24} />
            </div>
          </div>
          <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">Total Spent</div>
          <div className="text-3xl font-black text-foreground">
            {loading ? "..." : `₹${stats.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </motion.div>

        {expenseMode === "limit" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${stats.remaining! >= 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                <Activity size={24} />
              </div>
            </div>
            <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">Remaining Budget</div>
            <div className="text-3xl font-black text-foreground">
              {loading ? "..." : `₹${stats.remaining!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group opacity-60"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-variant text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
            </div>
            <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">Budget Limit</div>
            <div className="text-xl font-bold text-muted">No Limit Mode Active</div>
          </motion.div>
        )}

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="p-6 rounded-[2rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-tertiary-50 text-tertiary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-1">Daily Average</div>
          <div className="text-3xl font-black text-foreground">
            {loading ? "..." : `₹${stats.dailyAverage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Recent Activity */}
        <div className="bg-surface rounded-[2.5rem] border border-border-subtle overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 sm:p-8 flex items-center justify-between border-b border-border-subtle">
            <h3 className="text-xl font-bold">Recent Activity</h3>
            <Link href="/expenses" className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex-1 p-0">
             {loading ? (
               <div className="p-8 text-center text-secondary animate-pulse">Loading recent expenses...</div>
             ) : expenses.length === 0 ? (
               <div className="p-8 text-center text-secondary">
                 No activity this month. Get started by adding an expense!
               </div>
             ) : (
               <div className="divide-y divide-border-subtle">
                 {expenses.slice(0, 5).map((exp) => (
                   <div key={exp.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-surface-variant/50 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                         exp.category === "Needs" ? "bg-primary-500" : "bg-tertiary-500"
                       }`}>
                         {exp.subcategory.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <h4 className="font-bold">{exp.subcategory}</h4>
                         <div className="text-xs text-secondary font-medium mt-0.5">
                           {new Date(exp.date).toLocaleDateString('en-IN')}
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="font-bold">₹{exp.amount.toLocaleString('en-IN')}</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="bg-surface rounded-[2.5rem] border border-border-subtle p-8 min-h-[300px] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-6 text-muted">
            <PieChart size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Category Breakdown coming soon</h3>
          <p className="text-secondary mb-8">Visualize your spending patterns across categories once the chart component is implemented.</p>
        </div>
      </motion.div>
    </div>
  );
}
