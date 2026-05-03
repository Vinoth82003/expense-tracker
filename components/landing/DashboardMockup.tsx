"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Activity,
  ShoppingCart,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon
} from "lucide-react";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4"];

export function DashboardMockup() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 rounded-[2.5rem] bg-background border border-border-subtle shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[80px] -ml-32 -mb-32 rounded-full" />

      {/* Header Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] tracking-widest uppercase mb-1">
            <Sparkles size={14} />
            Forensic AI Active
          </div>
          <h3 className="text-2xl font-black text-foreground">Hey Vinoth! 👋</h3>
          <p className="text-sm text-secondary font-bold">Your financial pulse for May.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 px-4 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-secondary">
            May 2026
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        {[
          { icon: Wallet, label: "Spent", value: "₹42,500", color: "text-primary-500", bg: "bg-primary-500/10" },
          { icon: TrendingUp, label: "Income", value: "₹1,20,000", color: "text-success", bg: "bg-success/10" },
          { icon: Activity, label: "Balance", value: "₹77,500", color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { icon: ShoppingCart, label: "Avg/Day", value: "₹1,370", color: "text-secondary", bg: "bg-surface-variant" }
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={16} />
            </div>
            <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">{kpi.label}</div>
            <div className="text-base font-black text-foreground">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
        {/* Chart Mockup */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm flex flex-col min-h-[280px]">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-secondary">Spending Trend</h4>
            <ArrowUpRight size={18} className="text-primary-500" />
          </div>
          <div className="flex-1 flex items-end gap-2 px-2 pb-2">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                className="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{(h * 100).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[9px] font-black text-muted uppercase tracking-tighter">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Categories Mockup */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-secondary">Top Sectors</h4>
            <PieChartIcon size={18} className="text-violet-500" />
          </div>
          <div className="space-y-4">
            {[
              { name: "Food & Dining", value: "₹12,400", percent: 65, color: COLORS[0] },
              { name: "Transport", value: "₹4,200", percent: 35, color: COLORS[1] },
              { name: "Shopping", value: "₹8,900", percent: 50, color: COLORS[2] },
              { name: "Utilities", value: "₹5,000", percent: 40, color: COLORS[3] }
            ].map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wide">
                  <span className="text-secondary">{cat.name}</span>
                  <span className="text-foreground">{cat.value}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percent}%` }}
                    transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
