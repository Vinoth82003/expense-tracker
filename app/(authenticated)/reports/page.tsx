"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  PieChart as ChartIcon, 
  TrendingUp, 
  Target, 
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#84cc16'];

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-4 rounded-xl shadow-xl z-50">
        <p className="text-muted text-xs font-bold uppercase mb-1">{label}</p>
        <p className="font-black text-xl text-primary-500">₹{payload[0].value.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <span className="font-bold text-secondary">{payload[0].name}</span>
        <span className="font-black text-foreground ml-2">₹{payload[0].value.toLocaleString('en-IN')}</span>
      </div>
    );
  }
  return null;
};

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
    return { total, needs, wants };
  }, [expenses]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(exp => {
      const day = exp.date.split("T")[0]; // Group by YYYY-MM-DD
      map.set(day, (map.get(day) || 0) + exp.amount);
    });
    
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        amount
      }));
  }, [expenses]);

  const subcategoryData = useMemo(() => {
    const map = new Map<string, { value: number; category: string }>();
    expenses.forEach(exp => {
      const current = map.get(exp.subcategory) || { value: 0, category: exp.category };
      map.set(exp.subcategory, { value: current.value + exp.amount, category: exp.category });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, value: data.value, category: data.category }))
      .sort((a, b) => b.value - a.value); // sort descending
  }, [expenses]);

  const topSubcategories = subcategoryData.slice(0, 5);
  const needsPercentage = stats.total > 0 ? (stats.needs / stats.total) * 100 : 0;
  const wantsPercentage = stats.total > 0 ? (stats.wants / stats.total) * 100 : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">
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

      {/* Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Spending Trend (span 2) */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm lg:col-span-2">
           <h3 className="text-xl font-black mb-6 flex items-center gap-3">
             <TrendingUp size={24} className="text-primary-500" />
             Daily Spending Trend
           </h3>
           <div className="h-72 w-full">
             {dailyData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                 <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border-subtle opacity-20" />
                   <XAxis 
                     dataKey="date" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }} 
                     className="text-muted" 
                     dy={10} 
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }} 
                     tickFormatter={(val) => `₹${val}`} 
                     className="text-muted" 
                     dx={-10} 
                   />
                   <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                   <Area 
                     type="monotone" 
                     dataKey="amount" 
                     stroke="#6366f1" 
                     strokeWidth={4} 
                     fillOpacity={1} 
                     fill="url(#colorAmount)" 
                     activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-full flex items-center justify-center text-muted font-bold italic">
                 No trend data available for this month.
               </div>
             )}
           </div>
        </div>

        {/* Subcategory Distribution (span 1) */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm flex flex-col">
           <h3 className="text-xl font-black mb-6 flex items-center gap-3">
             <ChartIcon size={24} className="text-tertiary-500" />
             Distribution
           </h3>
           <div className="flex-1 flex flex-col items-center justify-center">
             {subcategoryData.length > 0 ? (
               <>
                 <div className="h-48 w-full shrink-0">
                   <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                     <RePieChart>
                       <Pie
                         data={subcategoryData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                         stroke="none"
                       >
                         {subcategoryData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip content={<CustomPieTooltip />} />
                     </RePieChart>
                   </ResponsiveContainer>
                 </div>
                 
                 {/* Legend */}
                 <div className="w-full mt-6 space-y-3 max-h-40 overflow-hidden overflow-y-auto custom-scrollbar pr-2">
                    {subcategoryData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="font-bold text-secondary group-hover:text-foreground transition-colors truncate max-w-[120px]">{entry.name}</span>
                        </div>
                        <span className="font-black shrink-0">₹{entry.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                 </div>
               </>
             ) : (
               <div className="text-muted font-bold italic">
                 No categorical data available.
               </div>
             )}
           </div>
        </div>
        
        {/* Top Spending & Insight (Row 2) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Top Categories Progress Bars */}
           <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <TrendingUp size={24} className="text-primary-500" />
                Top 5 Categories
              </h3>
              <div className="space-y-6">
                {topSubcategories.map((entry, i) => (
                  <div key={entry.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-lg">{entry.name}</span>
                      <span className="font-black">₹{entry.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(entry.value / (topSubcategories[0].value || 1)) * 100}%` }}
                        className="h-full rounded-full shadow-inner"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
                {topSubcategories.length === 0 && (
                  <div className="py-12 text-center text-secondary font-medium italic">
                    No transactions to analyze yet.
                  </div>
                )}
              </div>
           </div>

           {/* Smart Insight Card */}
           <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-between relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <Target size={120} />
             </div>
             
             <div className="relative z-10">
               <h3 className="text-2xl font-black mb-4">Smart Insight</h3>
               <p className="text-secondary font-bold text-lg leading-snug">
                 {needsPercentage > 60 
                   ? "You're heavily focused on essentials this month. Consider if any 'Needs' can be optimized to free up savings." 
                   : "Your spending balance is healthy. You're maintaining a good ratio between survival and enjoyment."}
               </p>
             </div>

             <div className="mt-12 relative z-10">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-variant border border-border-subtle font-bold text-sm text-foreground">
                 <Zap size={16} className="text-warning" />
                 Optimization Tip
               </div>
               <p className="mt-4 text-muted text-sm font-medium">
                 Try the 50/30/20 rule next month for better financial freedom.
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
