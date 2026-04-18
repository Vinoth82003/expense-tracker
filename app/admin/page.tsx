"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  Activity,
  Plus,
  ChevronRight,
  TrendingDown
} from "lucide-react";

interface ActivityItem {
  user: string;
  action: string;
  amount: string;
  time: string;
  type: "income" | "expense";
}

interface StatsData {
  totalUsers: number;
  totalExpenses: number;
  totalIncome: number;
  avgSavings: number;
  recentActivity: ActivityItem[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Optional refresh interval for real-time pulse look
    const interval = setInterval(fetchStats, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const diffInMs = new Date(dateString).getTime() - new Date().getTime();
    const diffInMins = Math.round(diffInMs / (1000 * 60));
    
    if (Math.abs(diffInMins) < 1) return "Just now";
    if (Math.abs(diffInMins) < 60) return Math.abs(diffInMins) + " mins ago";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers.toLocaleString() || "0", icon: Users, trend: "+12%", color: "text-primary-600", bg: "bg-primary-50" },
    { label: "System Revenue", value: "₹" + (stats?.totalIncome.toLocaleString() || "0"), icon: DollarSign, trend: "+8%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Transaction Volume", value: "₹" + (stats?.totalExpenses.toLocaleString() || "0"), icon: CreditCard, trend: "+24%", color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Avg Savings Rate", value: (stats?.avgSavings || "0") + "%", icon: TrendingUp, trend: "+5%", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">System Overview</h1>
          <p className="text-secondary font-medium">Welcome back, Administrator. Real-time platform metrics below.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-5 py-2.5 rounded-xl bg-surface border border-border-subtle font-bold text-sm hover:bg-surface-variant transition-all">
             Download Report
           </button>
           <button className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-black text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center gap-2">
             <Plus size={16} />
             Add Content
           </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
          >
            {loading && (
              <div className="absolute inset-0 bg-surface z-10 flex items-center justify-center backdrop-blur-sm bg-opacity-80">
                <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon size={28} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                <ArrowUpRight size={12} />
                {stat.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest">{stat.label}</p>
              <h2 className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 p-10 rounded-[3rem] bg-surface border border-border-subtle shadow-sm flex flex-col min-h-[400px] relative">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-foreground flex items-center gap-3">
              <Activity size={24} className="text-primary-600" />
              Live Platform Pulse
            </h3>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Database
            </span>
          </div>

          <div className="flex-1 space-y-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="flex justify-between items-center animate-pulse">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-surface-variant" />
                           <div className="space-y-2">
                             <div className="h-4 w-24 bg-surface-variant rounded-md" />
                             <div className="h-3 w-32 bg-surface-variant rounded-md" />
                           </div>
                        </div>
                        <div className="space-y-2 items-end flex flex-col">
                           <div className="h-4 w-20 bg-surface-variant rounded-md" />
                           <div className="h-3 w-16 bg-surface-variant rounded-md" />
                        </div>
                     </div>
                   ))}
                </motion.div>
              ) : stats?.recentActivity.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
                  <Activity size={48} className="text-muted opacity-20 mb-4" />
                  <p className="font-bold text-secondary text-sm">No recent network activity observed.</p>
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {stats?.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-border-subtle last:border-none group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-variant text-foreground'}`}>
                            {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                            <div className="text-sm font-black text-foreground">{item.user}</div>
                            <div className="text-xs font-bold text-secondary">{item.action}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-black ${item.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>{item.amount}</div>
                          <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{formatRelativeTime(item.time)}</div>
                        </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Links */}
        <div className="p-10 rounded-[3rem] bg-primary-600 text-white shadow-xl shadow-primary-600/20 relative overflow-hidden h-fit">
           <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 blur-3xl rounded-full" />
           <h3 className="text-xl font-black mb-8 relative z-10">Quick Controls</h3>
           <div className="grid grid-cols-1 gap-4 relative z-10">
              <button className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-between border border-white/10 font-black text-sm transition-all group">
                Flush Cache
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-between border border-white/10 font-black text-sm transition-all group">
                Backup Database
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-between border border-white/10 font-black text-sm transition-all group">
                Update Schema
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 rounded-2xl flex items-center justify-between font-black text-sm transition-all group mt-6">
                Broadcast Alert
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
