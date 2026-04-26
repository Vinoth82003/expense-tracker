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
  TrendingDown,
  Trash2,
  Calendar,
  Search,
  Filter,
  UserX,
  AlertTriangle,
  RefreshCcw,
  Zap,
  Settings,
  BarChart3,
  MousePointer2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface ActivityItem {
  user: string;
  action: string;
  amount: string;
  time: string;
  type: "income" | "expense";
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  streak: number;
  lastActive: string | null;
  createdAt: string;
  _count: {
    expenses: number;
    incomes: number;
  };
}

interface StatsData {
  totalUsers: number;
  totalExpenses: number;
  totalIncome: number;
  avgSavings: number;
  recentActivity: ActivityItem[];
  chartData: Array<{
    month: string;
    users: number;
    expenses: number;
    income: number;
  }>;
}

type AdminTab = "Overview" | "Users" | "System";

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("Overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkThreshold, setBulkThreshold] = useState(0);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers()]);
      setLoading(false);
    };
    init();

    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? All their data will be permanently removed.")) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ALL users with a streak less than ${bulkThreshold}? This action cannot be undone.`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minStreak: bulkThreshold }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchUsers();
        fetchStats();
        setIsBulkModalOpen(false);
      }
    } catch (error) {
      console.error("Bulk delete failed", error);
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const diffInMs = new Date(dateString).getTime() - new Date().getTime();
    const diffInMins = Math.round(diffInMs / (1000 * 60));
    
    if (Math.abs(diffInMins) < 1) return "Just now";
    if (Math.abs(diffInMins) < 60) return Math.abs(diffInMins) + "m ago";
    if (Math.abs(diffInMins) < 1440) return Math.round(Math.abs(diffInMins) / 60) + "h ago";
    return new Date(dateString).toLocaleDateString();
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers.toLocaleString() || "0", icon: Users, trend: "+12%", color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Total Income", value: "₹" + (stats?.totalIncome.toLocaleString() || "0"), icon: DollarSign, trend: "+8%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Expenses", value: "₹" + (stats?.totalExpenses.toLocaleString() || "0"), icon: CreditCard, trend: "+24%", color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Avg Savings", value: (stats?.avgSavings || "0") + "%", icon: TrendingUp, trend: "+5%", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Admin Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface p-8 rounded-[3rem] border border-border-subtle shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/20">
            <Zap size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tighter italic">Control Center</h1>
            <p className="text-secondary font-bold text-sm">System integrity: <span className="text-success">Optimal</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface-variant p-1.5 rounded-2xl">
          {(["Overview", "Users", "System"] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeTab === tab 
                  ? "bg-surface text-primary-600 shadow-sm" 
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "Overview" && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
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

            {/* Visualizations Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Transaction Trend Chart */}
              <div className="p-10 rounded-[3rem] bg-surface border border-border-subtle shadow-sm flex flex-col h-[450px]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                    <BarChart3 size={24} className="text-primary-600" />
                    Transaction Volume Trend
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                      Income
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      Expenses
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.chartData || []}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        tickFormatter={(value) => `₹${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '1.5rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '1.5rem'
                        }}
                        itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#4f46e5" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorIncome)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#8b5cf6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorExpense)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Growth Chart */}
              <div className="p-10 rounded-[3rem] bg-surface border border-border-subtle shadow-sm flex flex-col h-[450px]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                    <Users size={24} className="text-emerald-600" />
                    New User Acquisition
                  </h3>
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Monthly Growth</span>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '1.5rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '1.5rem'
                        }}
                        itemStyle={{ fontWeight: 900, fontSize: '12px', color: '#10b981' }}
                      />
                      <Bar dataKey="users" radius={[10, 10, 0, 0]}>
                        {(stats?.chartData || []).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === (stats?.chartData.length || 0) - 1 ? '#10b981' : '#d1fae5'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Platform Pulse & Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 p-10 rounded-[3rem] bg-surface border border-border-subtle shadow-sm min-h-[500px]">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                    <Activity size={24} className="text-primary-600" />
                    Global Transaction Pulse
                  </h3>
                  <button onClick={fetchStats} className="p-2 hover:bg-surface-variant rounded-xl transition-colors">
                    <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="space-y-6">
                  {stats?.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-5 border-b border-border-subtle last:border-none group">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-variant text-foreground'
                        }`}>
                          {item.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground">{item.user}</div>
                          <div className="text-xs font-bold text-secondary">{item.action}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-md font-black ${item.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>{item.amount}</div>
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest">{formatRelativeTime(item.time)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Insights */}
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                  <h3 className="text-lg font-black mb-6 relative z-10 flex items-center gap-2">
                    <Activity size={20} />
                    Engagement
                  </h3>
                  <div className="space-y-6 relative z-10">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-100">Active Streaks</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-black">{users.filter(u => u.streak > 0).length}</div>
                        <div className="text-xs text-indigo-200">Users</div>
                      </div>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-100">Daily Active (24h)</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-black">
                          {users.filter(u => u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 86400000).length}
                        </div>
                        <div className="text-xs text-indigo-200">Users</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-surface border border-border-subtle shadow-sm">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                    <RefreshCcw size={20} className="text-primary-600" />
                    System Maintenance
                  </h3>
                  <div className="space-y-4">
                    <button 
                      onClick={() => { setBulkThreshold(1); setIsBulkModalOpen(true); }}
                      className="w-full py-4 px-6 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl flex items-center justify-between font-black text-sm transition-all"
                    >
                      Inactive Cleanup
                      <Trash2 size={18} />
                    </button>
                    <button className="w-full py-4 px-6 bg-surface-variant/50 text-foreground hover:bg-surface-variant rounded-2xl flex items-center justify-between font-black text-sm transition-all">
                      Export Registry
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {activeTab === "Users" && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-surface p-10 rounded-[3rem] border border-border-subtle shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-variant rounded-2xl border-none focus:ring-2 focus:ring-primary-500 font-bold text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-border-subtle rounded-2xl font-black text-sm hover:bg-surface-variant transition-all">
                    <Filter size={18} />
                    Filters
                  </button>
                  <button 
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                  >
                    <UserX size={18} />
                    Bulk Delete
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                      <th className="px-6 py-2">User Identity</th>
                      <th className="px-6 py-2">Streak</th>
                      <th className="px-6 py-2">Last Active</th>
                      <th className="px-6 py-2">Activity Count</th>
                      <th className="px-6 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="group bg-surface-variant/30 hover:bg-surface-variant transition-colors rounded-[2rem]">
                        <td className="px-6 py-6 rounded-l-[1.5rem]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center font-black text-primary-600">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-sm text-foreground">{user.name || "Anonymous"}</div>
                              <div className="text-xs font-bold text-muted">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                              user.streak > 0 ? "bg-amber-50 text-amber-600" : "bg-surface-variant text-muted"
                            }`}>
                              <Zap size={10} fill={user.streak > 0 ? "currentColor" : "none"} />
                              {user.streak}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-bold text-sm text-secondary">
                          {formatRelativeTime(user.lastActive)}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4 text-xs font-black">
                            <div className="flex items-center gap-1 text-emerald-600">
                              <TrendingUp size={12} /> {user._count.incomes}
                            </div>
                            <div className="flex items-center gap-1 text-rose-600">
                              <TrendingDown size={12} /> {user._count.expenses}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right rounded-r-[1.5rem]">
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-3 text-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {activeTab === "System" && (
        <div className="p-10 rounded-[3rem] bg-surface border border-border-subtle shadow-sm flex flex-col items-center justify-center py-32 space-y-6">
           <div className="w-20 h-20 rounded-[2rem] bg-surface-variant flex items-center justify-center text-muted">
             <Settings size={40} />
           </div>
           <div className="text-center space-y-2">
             <h3 className="text-2xl font-black tracking-tight">System Configuration</h3>
             <p className="text-secondary font-bold max-w-sm">Direct database and environment controls are restricted to terminal-only access for security.</p>
           </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-surface border border-border-subtle rounded-[3rem] p-10 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Cleanup Users</h2>
                <p className="text-sm font-bold text-secondary italic">
                  Bulk delete inactive users who have not maintained their streak.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span>Streak Threshold</span>
                    <span className="text-primary-600">{bulkThreshold} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={bulkThreshold}
                    onChange={(e) => setBulkThreshold(parseInt(e.target.value))}
                    className="w-full h-2 bg-surface-variant rounded-full appearance-none cursor-pointer accent-primary-600"
                  />
                  <p className="text-[10px] text-muted font-bold">
                    Users with streak LOWER than this value will be purged. Current selection: {
                      users.filter(u => u.streak < bulkThreshold).length
                    } users at risk.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleBulkDelete}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-md shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                  >
                    Execute Purge
                  </button>
                  <button
                    onClick={() => setIsBulkModalOpen(false)}
                    className="w-full py-4 bg-surface-variant font-black text-md rounded-2xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
