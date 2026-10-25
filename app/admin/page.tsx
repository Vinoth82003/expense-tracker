"use client";

import { useEffect, useState, useCallback, type ComponentType, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, 
  Activity, 
  Brain, 
  Download,
  ArrowUpRight, 
  RefreshCcw, 
  UserPlus,
  FileText,
  AlertTriangle,
  ChevronRight,
  Send,
  ShieldAlert,
  History,
  Terminal,
  Star
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
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  activeToday: number;
  activeDelta: number;
  activeYesterday: number;
  newUsersToday: number;
  newUsersYesterday: number;
  aiReports: number;
  aiReportsToday: number;
  tokensUsed: string;
  tokenPercentage: number;
  pwaInstalls: number;
  systemHealth: Record<string, { status: string, color: string, scope?: string }>;
  healthCheckedAt?: string;
  mailJobs?: { recent: number; stuck: number; failed: number };
  charts: {
    registrations: Array<{ date: string, count: number }>;
    volume: Array<{ name: string, count: number, fill: string }>;
  };
}

const HEALTH_LABELS: Record<string, string> = {
  mongodb: "MongoDB",
  nextauth: "Auth",
  nodemailer: "SMTP",
  emailJobs: "Email jobs",
  gemini: "Gemini",
};
const HEALTH_MONITORED =
  "Monitored: database ping · session secret · SMTP config · email-job queue · Gemini key";

interface ActivityItem {
  type: string;
  userId: string;
  description: string;
  timestamp: string;
  color: string;
}

interface TopUser {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  expenseCount: number;
  reportCount: number;
  lastActive: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(false);
    try {
      const [statsRes, activityRes, topUsersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
        fetch("/api/admin/top-users")
      ]);

      if (!statsRes.ok || !activityRes.ok || !topUsersRes.ok) {
        setLoadError(true);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
      if (topUsersRes.ok) setTopUsers(await topUsersRes.json());
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchAllData();
  }, [fetchAllData]);

  const formatRelativeTime = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  if (!mounted) return null;

  const healthEntries = stats ? Object.values(stats.systemHealth) : [];
  const healthHasRed = healthEntries.some((h) => h.color === "red");
  const healthLabel = !stats ? "Checking…" : healthHasRed ? "Degraded" : "Healthy";

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--admin-text-primary)] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-[var(--admin-text-secondary)] font-medium">Platform overview — <span className="text-emerald-500 animate-pulse">live</span></p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3">
          <button 
            onClick={fetchAllData}
            className={`p-2.5 md:p-3 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)] rounded-xl transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={20} />
          </button>
          <div className="h-8 w-[1px] bg-[var(--admin-border)] mx-1 hidden md:block" />
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[var(--admin-bg-surface-variant)] rounded-xl text-[var(--admin-text-secondary)] text-[10px] md:text-xs font-bold uppercase tracking-widest">
            <Activity size={14} className={healthHasRed ? "text-rose-500" : "text-emerald-500"} />
            {healthLabel}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            <p className="text-xs md:text-sm font-medium text-rose-600 dark:text-rose-400">
              Some dashboard data failed to load. Figures may be incomplete.
            </p>
          </div>
          <button
            onClick={fetchAllData}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors"
          >
            <RefreshCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      )}

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard 
          title="Total users"
          value={stats ? stats.totalUsers : "—"}
          trend={stats ? `+${stats.newUsersToday} new in last 24h` : undefined}
          trendColor="text-emerald-500"
          hint="All registered accounts (all time). Trend = accounts created in the rolling last 24h."
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
        />
        <KPICard 
          title="Active today"
          value={stats ? stats.activeToday : "—"}
          trend={stats ? `${stats.activeDelta >= 0 ? "+" : ""}${stats.activeDelta} vs prior 24h` : undefined}
          trendColor={(stats?.activeDelta ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"}
          hint="Users with activity in the rolling last 24h. Delta compares the previous 24h window (48h–24h ago)."
          icon={Activity}
          iconColor="text-teal-500"
          iconBg="bg-teal-50 dark:bg-teal-500/10"
        />
        <KPICard 
          title="AI reports run"
          value={stats ? stats.aiReports : "—"}
          trend={stats ? `${stats.aiReportsToday} in last 24h` : undefined}
          trendColor="text-[var(--admin-text-muted)]"
          hint="All AI reports generated (all time). Trend = reports in the rolling last 24h. Matches /admin/reports totals."
          icon={Brain}
          iconColor="text-purple-500"
          iconBg="bg-purple-50 dark:bg-purple-500/10"
        />
        <KPICard 
          title="PWA downloads"
          value={stats ? stats.pwaInstalls : "—"}
          trend={stats ? `${stats.totalUsers ? Math.round((stats.pwaInstalls / stats.totalUsers) * 100) : 0}% of users` : undefined}
          trendColor="text-blue-500"
          hint="Users with the PWA installed. Share is out of all registered users."
          icon={Download}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Registration Trend */}
        <div className="lg:col-span-6 p-5 md:p-8 bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2.5rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-bold text-[var(--admin-text-primary)]">User registrations</h3>
            <span title="New accounts created per calendar day across the last 30 days (UTC dates)." className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Last 30 days</span>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.charts.registrations || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--admin-text-muted)', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => val.split('-')[2]}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--admin-text-muted)', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)', borderRadius: '12px', color: 'var(--admin-text-primary)' }}
                    itemStyle={{ color: '#14b8a6' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Volume */}
        <div className="lg:col-span-4 p-5 md:p-8 bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2.5rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-bold text-[var(--admin-text-primary)]">AI report volume</h3>
            <span title="Reports generated per calendar day over the last 7 days. Bar colour: green ≤5, amber 6–15, red >15." className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Last 7 days</span>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.charts.volume || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--admin-text-muted)', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--admin-text-muted)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--admin-bg-surface-variant)' }}
                  contentStyle={{ backgroundColor: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)', borderRadius: '12px', color: 'var(--admin-text-primary)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(stats?.charts.volume || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: System Health */}
      <div className="p-5 md:p-8 bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2.5rem] border border-[var(--admin-border)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-bold text-[var(--admin-text-primary)]">System health</h3>
            <p className="text-[10px] md:text-xs text-[var(--admin-text-muted)] font-medium">
              {stats?.healthCheckedAt
                ? `Last checked: ${formatRelativeTime(stats.healthCheckedAt)}`
                : "Not checked yet"}
            </p>
            <p className="text-[10px] text-[var(--admin-text-muted)] font-medium max-w-md">
              {HEALTH_MONITORED}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {!stats && (
              <span className="text-xs font-medium text-[var(--admin-text-muted)]">Loading health checks…</span>
            )}
            {stats && Object.entries(stats.systemHealth).map(([key, info]) => (
              <div
                key={key}
                title={info.scope}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border)] rounded-xl"
              >
                <div className={`w-2 h-2 rounded-full ${
                  info.color === 'green' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  info.color === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                  'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                }`} />
                <span className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-secondary)] uppercase tracking-widest">{HEALTH_LABELS[key] ?? key}</span>
                <span className="text-xs font-bold text-[var(--admin-text-primary)]">{info.status}</span>
              </div>
            ))}
            <button
              onClick={fetchAllData}
              aria-label="Re-check system health"
              className="p-2 hover:bg-[var(--admin-bg-surface-variant)] rounded-lg text-[var(--admin-text-muted)] transition-colors"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="p-5 md:p-8 bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2.5rem] max-h-[500px] border border-[var(--admin-border)] shadow-sm flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 dark:bg-teal-500/10 text-teal-600 rounded-lg">
                <History size={18} />
              </div>
              <h3 className="text-base md:text-lg font-bold text-[var(--admin-text-primary)]">Recent activity feed</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest" title="Latest 20 events across signups, AI reports and budget updates.">Latest 20</span>
              <Link href="/admin/logs" className="text-[10px] md:text-xs font-bold text-teal-500 hover:underline">View all</Link>
            </div>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide pr-2">
            {loading && activity.length === 0 && (
              <p className="text-xs font-medium text-[var(--admin-text-muted)]">Loading activity…</p>
            )}
            {!loading && activity.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <History size={22} className="text-[var(--admin-text-muted)]" />
                <p className="text-xs font-medium text-[var(--admin-text-muted)]">No recent activity to show.</p>
              </div>
            )}
            {activity.map((item) => (
              <div key={`${item.type}-${item.userId}-${item.timestamp}`} className="flex items-start gap-3 md:gap-4 group">
                <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                  item.color === 'teal' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-500' :
                  item.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' :
                  item.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                  'bg-red-50 dark:bg-red-500/10 text-red-500'
                }`}>
                  {item.type === 'signup' && <UserPlus size={14} />}
                  {item.type === 'report' && <FileText size={14} />}
                  {item.type === 'budget' && <Activity size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs md:text-sm font-medium text-[var(--admin-text-primary)] line-clamp-2 leading-relaxed">{item.description}</p>
                    <span className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase whitespace-nowrap shrink-0">{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="p-5 md:p-8 bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2.5rem] border border-[var(--admin-border)] shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-bold text-[var(--admin-text-primary)]">Top active users</h3>
            <span title="Ranked by total AI reports, then expenses (all time). Admin and test accounts excluded." className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">All time · by reports</span>
          </div>
          {!loading && topUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Users size={22} className="text-[var(--admin-text-muted)]" />
              <p className="text-xs font-medium text-[var(--admin-text-muted)]">No ranked users yet.</p>
            </div>
          )}
          <div className="flex-1 overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8 scrollbar-hide">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest border-b border-[var(--admin-border-subtle)]">
                  <th className="pb-4 pr-4">Rank</th>
                  <th className="pb-4 px-4">User</th>
                  <th className="pb-4 px-4">Expenses</th>
                  <th className="pb-4 px-4">AI Reports</th>
                  <th className="pb-4 pl-4 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                {topUsers.map((user) => (
                  <tr key={user.userId} className="group hover:bg-[var(--admin-bg-surface-variant)] transition-colors cursor-pointer" onClick={() => router.push(`/admin/users?id=${user.userId}`)}>
                    <td className="py-4 pr-4 font-bold text-[var(--admin-text-muted)] text-xs md:text-sm">#{user.rank}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-surface-variant)] flex items-center justify-center text-[10px] font-bold text-[var(--admin-text-secondary)] overflow-hidden shrink-0">
                          {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                        <span className="text-xs md:text-sm font-bold text-[var(--admin-text-primary)] group-hover:text-teal-500 transition-colors truncate">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs md:text-sm font-medium text-[var(--admin-text-secondary)]">{user.expenseCount}</td>
                    <td className="py-4 px-4 text-xs md:text-sm font-medium text-[var(--admin-text-secondary)]">{user.reportCount}</td>
                    <td className="py-4 pl-4 text-right text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase">{formatRelativeTime(user.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <Link href="/admin/notifications" className="p-5 md:p-6 bg-teal-500 hover:bg-teal-600 rounded-2xl md:rounded-3xl text-white shadow-lg shadow-teal-500/20 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl shrink-0">
              <Send size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-sm md:text-lg leading-tight mb-1 truncate">Announce</p>
              <p className="text-white/70 text-[10px] font-medium truncate">Broadcast to users</p>
            </div>
          </div>
          <ChevronRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
        <Link href="/admin/transactions?flagged=true" className="p-5 md:p-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl md:rounded-3xl text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl shrink-0">
              <ShieldAlert size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-sm md:text-lg leading-tight mb-1 truncate">Flagged</p>
              <p className="text-white/70 text-[10px] font-medium truncate">Review activity</p>
            </div>
          </div>
          <ChevronRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
        <Link href="/admin/security?tab=lockouts" className="p-5 md:p-6 bg-[var(--admin-bg-card)] hover:bg-[var(--admin-bg-surface-variant)] rounded-2xl md:rounded-3xl text-[var(--admin-text-primary)] shadow-lg transition-all flex items-center justify-between group border border-[var(--admin-border)]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl shrink-0">
              <AlertTriangle size={20} className="text-amber-500 md:w-6 md:h-6" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-sm md:text-lg leading-tight mb-1 truncate">Lockouts</p>
              <p className="text-white/70 text-[10px] font-medium truncate">Manage access</p>
            </div>
          </div>
          <ChevronRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
        <Link href="/admin/logs" className="p-5 md:p-6 bg-[var(--admin-bg-surface-variant)] hover:bg-[var(--admin-border-subtle)] rounded-2xl md:rounded-3xl text-[var(--admin-text-primary)] transition-all flex items-center justify-between group border border-[var(--admin-border)]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-[var(--admin-bg-card)] rounded-xl md:rounded-2xl text-[var(--admin-text-secondary)] shrink-0">
              <Terminal size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-sm md:text-lg leading-tight mb-1 truncate">Logs</p>
              <p className="text-[var(--admin-text-secondary)] text-[10px] font-medium truncate">Track system events</p>
            </div>
          </div>
          <ChevronRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
        <Link href="/admin/reviews" className="p-5 md:p-6 bg-amber-500 hover:bg-amber-600 rounded-2xl md:rounded-3xl text-white shadow-lg shadow-amber-500/20 transition-all flex items-center justify-between group sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl shrink-0">
              <Star size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-sm md:text-lg leading-tight mb-1 truncate">Feedback</p>
              <p className="text-white/70 text-[10px] font-medium truncate">Manage reviews</p>
            </div>
          </div>
          <ChevronRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: ReactNode;
  trend?: string;
  trendColor?: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  iconColor: string;
  iconBg: string;
  warning?: boolean;
  hint?: string;
}

function KPICard({ title, value, trend, trendColor, icon: Icon, iconColor, iconBg, warning, hint }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      title={hint}
      className={`p-5 md:p-8 bg-[var(--admin-bg-card)] rounded-3xl md:rounded-[2.5rem] border ${warning ? 'border-amber-500/50' : 'border-[var(--admin-border)]'} shadow-sm hover:shadow-xl transition-all group overflow-hidden relative`}
    >
      {warning && (
        <div className="absolute top-0 right-0 p-3">
          <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
        </div>
      )}
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${iconBg} ${iconColor} transition-transform group-hover:scale-110`}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[9px] md:text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2 md:gap-3">
          <h2 className="text-xl md:text-3xl font-bold text-[var(--admin-text-primary)] tabular-nums">{value}</h2>
          <p className={`text-[10px] md:text-xs font-bold ${trendColor} flex items-center gap-1 whitespace-nowrap`}>
            {trend?.includes('+') && <ArrowUpRight size={12} className="md:w-3.5 md:h-3.5" />}
            {trend}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
