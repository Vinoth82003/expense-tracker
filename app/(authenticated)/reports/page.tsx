"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  PieChart as ChartIcon, 
  TrendingUp, 
  Target, 
  ShoppingBag, 
  Coffee, 
  Home, 
  Zap,
  ArrowUpRight,
  ChevronDown
} from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const monthFilter = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const res = await fetch(`/api/expenses?month=${monthFilter}`);
        const data = await res.json();
        setExpenses(data.expenses || []);
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchData();
  }, [session]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const needs = expenses.filter(e => e.category === "Needs").reduce((sum, exp) => sum + exp.amount, 0);
    const wants = expenses.filter(e => e.category === "Wants").reduce((sum, exp) => sum + exp.amount, 0);
    
    // Group by subcategory
    const bySub = expenses.reduce((acc, exp) => {
      acc[exp.subcategory] = (acc[exp.subcategory] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const topSubcategories = Object.entries(bySub)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { total, needs, wants, topSubcategories };
  }, [expenses]);

  const needsPercentage = stats.total > 0 ? (stats.needs / stats.total) * 100 : 0;
  const wantsPercentage = stats.total > 0 ? (stats.wants / stats.total) * 100 : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Monthly Summary Hero */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">
            <ChartIcon size={16} />
            Expense Analytics • {new Date().toLocaleDateString('en-IN', { month: 'long' })}
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4">
            ₹{stats.total.toLocaleString('en-IN')}
          </h2>
          <p className="text-secondary font-bold text-lg max-w-md leading-relaxed">
            Your spending is split between essential needs and lifestyle choices. Here's the breakdown.
          </p>
        </div>

        {/* Custom Progress Bar */}
        <div className="mt-12 space-y-6">
          <div className="w-full h-8 bg-surface-variant rounded-full overflow-hidden flex shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${needsPercentage}%` }}
              className="h-full bg-primary-500 relative group"
            >
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${wantsPercentage}%` }}
              className="h-full bg-tertiary-500 relative group"
            >
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>
          
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-primary-500"></div>
              <div>
                <span className="block text-xl font-black">Needs ({Math.round(needsPercentage)}%)</span>
                <span className="text-xs text-secondary font-bold uppercase tracking-wider">₹{stats.needs.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-tertiary-500"></div>
              <div>
                <span className="block text-xl font-black">Wants ({Math.round(wantsPercentage)}%)</span>
                <span className="text-xs text-secondary font-bold uppercase tracking-wider">₹{stats.wants.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Categories */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
           <h3 className="text-xl font-black mb-8 flex items-center gap-3">
             <TrendingUp size={24} className="text-primary-500" />
             Top Spending
           </h3>
           <div className="space-y-6">
             {stats.topSubcategories.map(([name, amount], i) => (
               <div key={name} className="space-y-2">
                 <div className="flex justify-between items-end">
                   <span className="font-bold text-lg">{name}</span>
                   <span className="font-black">₹{amount.toLocaleString('en-IN')}</span>
                 </div>
                 <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(amount / (stats.topSubcategories[0][1] || 1)) * 100}%` }}
                     className="h-full bg-foreground/10 rounded-full"
                   />
                 </div>
               </div>
             ))}
             {stats.topSubcategories.length === 0 && (
               <div className="py-12 text-center text-secondary font-medium italic">
                 No transactions to analyze yet.
               </div>
             )}
           </div>
        </div>

        {/* Insight Card */}
        <div className="bg-foreground text-background rounded-[2.5rem] p-10 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Target size={120} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4">Smart Insight</h3>
            <p className="text-background/80 font-bold text-lg leading-snug">
              {needsPercentage > 60 
                ? "You're heavily focused on essentials this month. Consider if any 'Needs' can be optimized to free up savings." 
                : "Your spending balance is healthy. You're maintaining a good ratio between survival and enjoyment."}
            </p>
          </div>

          <div className="mt-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 border border-background/20 font-bold text-sm">
              <Zap size={16} className="text-yellow-400" />
              Optimization Tip
            </div>
            <p className="mt-4 text-background/60 text-sm font-medium">
              Try the 50/30/20 rule next month for better financial freedom.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
