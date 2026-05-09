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
  Scale,
  Settings2,
  AlertTriangle,
  Triangle
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis
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
  const { 
    expenses, 
    incomes, 
    monthlyLimit, 
    expenseMode, 
    loading, 
    isTogglingMode,
    toggleExpenseMode 
  } = useDashboard();
  
  const [mounted, setMounted] = useState(false);
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    setMounted(true);
  }, []);
  const stats = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netBalance = totalIncome - totalSpent;
    const remaining = monthlyLimit - totalSpent;
    const dailyAverage = totalSpent / (new Date().getDate() || 1);

    // Daily Limit Logic
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    const daysLeft = daysInMonth - currentDay + 1;
    
    const todayStr = today.toISOString().split('T')[0];
    const todaySpend = expenses
      .filter(e => e.date.startsWith(todayStr))
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const dailyLimit = expenseMode === "limit" ? Math.max(0, (monthlyLimit - (totalSpent - todaySpend)) / daysLeft) : 0;
    const todayUsagePercent = dailyLimit > 0 ? (todaySpend / dailyLimit) * 100 : 0;

    // 50/30/20 Breakdown
    const needs = expenses.filter(e => e.category === "Needs").reduce((sum, exp) => sum + exp.amount, 0);
    const wants = expenses.filter(e => e.category === "Wants").reduce((sum, exp) => sum + exp.amount, 0);
    const savings = Math.max(0, totalIncome - totalSpent);
    
    const totalAllocated = totalIncome || (totalSpent > 0 ? totalSpent : 1);
    const needsPct = (needs / totalAllocated) * 100;
    const wantsPct = (wants / totalAllocated) * 100;
    const savingsPct = (savings / totalAllocated) * 100;

    // Category breakdown for chart
    const catMap = new Map<string, number>();
    expenses.forEach(e => catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount));
    const chartData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

    // Radar Data for Triangle Rule
    const radarData = [
      { subject: `Needs (50%)`, A: Number(needsPct.toFixed(1)), B: 50 },
      { subject: `Wants (30%)`, A: Number(wantsPct.toFixed(1)), B: 30 },
      { subject: `Savings (20%)`, A: Number(savingsPct.toFixed(1)), B: 20 },
    ];

    return { 
      totalSpent, 
      totalIncome, 
      netBalance, 
      dailyAverage, 
      remaining, 
      chartData,
      radarData,
      dailyLimit,
      todaySpend,
      todayUsagePercent,
      daysLeft,
      breakdown503020: { needs, wants, savings, needsPct, wantsPct, savingsPct }
    };
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
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={toggleExpenseMode}
              disabled={isTogglingMode}
              className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-surface border border-border-subtle px-4 py-3 rounded-2xl shadow-sm hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              <Settings2 size={16} className={expenseMode === "limit" ? "text-primary-500" : "text-muted"} />
              {expenseMode === "limit" ? "Limit Active" : "No Limit"}
            </button>
            <div className="flex items-center justify-center gap-2 text-foreground font-black bg-surface border border-border-subtle px-5 py-3 rounded-2xl shadow-sm">
              <CalendarDays size={18} className="text-primary-500" />
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
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
      
      {/* Daily Limit Warning - Condition: limit mode active and budget set */}
      {expenseMode === "limit" && monthlyLimit > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group ${
            stats.todayUsagePercent <= 25 ? "bg-success/5 border-success/20" :
            stats.todayUsagePercent <= 50 ? "bg-warning/5 border-warning/20" :
            stats.todayUsagePercent <= 75 ? "bg-orange-500/5 border-orange-500/20" :
            "bg-error/5 border-error/20"
          }`}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
              stats.todayUsagePercent <= 25 ? "bg-success text-white" :
              stats.todayUsagePercent <= 50 ? "bg-warning text-white" :
              stats.todayUsagePercent <= 75 ? "bg-orange-500 text-white" :
              "bg-error text-white"
            }`}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black">Daily Spending Limit</h3>
              <p className="text-secondary font-bold">
                You have <span className="text-foreground">₹{Math.round(stats.dailyLimit).toLocaleString('en-IN')}</span> to spend today.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1 relative z-10">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Today's Spend</div>
            <div className={`text-3xl font-black ${
              stats.todayUsagePercent <= 25 ? "text-success" :
              stats.todayUsagePercent <= 50 ? "text-warning" :
              stats.todayUsagePercent <= 75 ? "text-orange-500" :
              "text-error"
            }`}>
              ₹{stats.todaySpend.toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-bold text-secondary">
              {stats.todayUsagePercent.toFixed(1)}% of daily quota used
            </div>
          </div>
          
          {/* Progress background bar */}
          <div className="absolute bottom-0 left-0 h-1.5 bg-surface-variant w-full">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.todayUsagePercent)}%` }}
              className={`h-full transition-all duration-1000 ${
                stats.todayUsagePercent <= 25 ? "bg-success" :
                stats.todayUsagePercent <= 50 ? "bg-warning" :
                stats.todayUsagePercent <= 75 ? "bg-orange-500" :
                "bg-error"
              }`}
            />
          </div>
        </motion.div>
      )}

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
                      <PieChart key={`pie-${stats.chartData.length}-${stats.totalSpent}`}>
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

      {/* 50/30/20 Triangle Graph Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-surface rounded-[3rem] border border-border-subtle p-8 sm:p-12 shadow-sm overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <Triangle size={14} />
            Budget Strategy
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">50/30/20 Rule Analysis</h2>
          <p className="text-secondary font-medium max-w-xl">
            Comparing your actual spending habits with the ideal financial health triangle for current month.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Triangle Visualization */}
          <div className="relative flex justify-center">
              <div className="w-full h-[400px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250} minWidth={100} minHeight={100}>
                  <RadarChart key={`radar-${stats.radarData[0].A}-${stats.radarData[1].A}-${stats.radarData[2].A}`} cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                    <PolarGrid stroke="#6366f120" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "currentColor", fontSize: 10, fontWeight: 800 }} className="text-secondary" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                    <Radar
                      name="Actual"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Suggested"
                      dataKey="B"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.3}
                      strokeDasharray="4 4"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '1rem', fontWeight: 'bold' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Text Breakdown */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-surface-variant/30 border border-border-subtle hover:border-primary-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="font-black uppercase tracking-widest text-xs">Essential Needs</span>
                </div>
                <span className={`font-black ${stats.breakdown503020.needsPct > 50 ? "text-error" : "text-success"}`}>
                  {stats.breakdown503020.needsPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-secondary font-medium leading-relaxed">
                Your actual spending on essentials like Rent, Utilities, and Groceries is 
                <span className="text-foreground font-bold"> ₹{stats.breakdown503020.needs.toLocaleString('en-IN')}</span>. 
                {stats.breakdown503020.needsPct > 50 ? " You are exceeding the recommended 50% limit." : " You are well within the 50% target."}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-variant/30 border border-border-subtle hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="font-black uppercase tracking-widest text-xs">Lifestyle Wants</span>
                </div>
                <span className={`font-black ${stats.breakdown503020.wantsPct > 30 ? "text-error" : "text-success"}`}>
                  {stats.breakdown503020.wantsPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-secondary font-medium leading-relaxed">
                You spent <span className="text-foreground font-bold">₹{stats.breakdown503020.wants.toLocaleString('en-IN')}</span> on 
                discretionary items. {stats.breakdown503020.wantsPct > 30 ? " Try to reduce lifestyle inflation." : " Excellent control over discretionary spending!"}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-variant/30 border border-border-subtle hover:border-success/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="font-black uppercase tracking-widest text-xs">Financial Savings</span>
                </div>
                <span className={`font-black ${stats.breakdown503020.savingsPct < 20 ? "text-warning" : "text-success"}`}>
                  {stats.breakdown503020.savingsPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-secondary font-medium leading-relaxed">
                Your net savings for this month is <span className="text-foreground font-bold">₹{stats.breakdown503020.savings.toLocaleString('en-IN')}</span>. 
                {stats.breakdown503020.savingsPct < 20 ? " Aim to increase your savings rate to reach the 20% milestone." : " You've hit your financial freedom target!"}
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
