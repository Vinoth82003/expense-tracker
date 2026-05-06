"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Brain,
  Zap,
  BarChart3,
  Settings,
  ArrowUpRight,
  Shield,
  X,
  User as UserIcon,
  Calendar,
  IndianRupee,
  Cpu,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface User {
  name: string | null;
  email: string;
  avatar: string | null;
}

interface Report {
  id: string;
  content: string | null;
  status: string;
  tokens: number;
  cost: number;
  error: string | null;
  date: string;
  user: User;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [search, setSearch] = useState("");

  // Config
  const [maxReports, setMaxReports] = useState(3);
  const [cleanupDays, setCleanupDays] = useState(30);

  // Detail View
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/reports/usage-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChartData(data.chartData);
        setMaxReports(data.stats.rateLimit);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?page=${page}&status=${selectedStatus}&search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, search]);

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, [fetchReports]);

  const updateRateLimit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/reports/rate-limit", {
        method: "PATCH",
        body: JSON.stringify({ maxPerDay: maxReports })
      });
      if (res.ok) alert("Rate limit updated!");
    } catch (error) {
      console.error("Failed to update rate limit", error);
    } finally {
      setActionLoading(false);
    }
  };

  const cleanupReports = async () => {
    if (!confirm(`Are you sure you want to delete reports older than ${cleanupDays} days?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/reports/cleanup", {
        method: "DELETE",
        body: JSON.stringify({ olderThanDays: cleanupDays })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchReports();
      }
    } catch (error) {
      console.error("Failed to cleanup", error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIsPanelOpen(false);
        fetchReports();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const tokenQuotaPercent = stats ? (stats.tokensToday / 3500000) * 100 : 0;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">AI report logs</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gemini API usage, forensic reports, cost tracking</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPIBox 
          label="Total Intelligent Reports" 
          value={stats?.reportsMonth?.toLocaleString() || "0"} 
          subValue="Generated this billing cycle"
          icon={Cpu}
          color="text-teal-500"
          trend="+12% vs last month"
        />
        <KPIBox 
          label="Daily Velocity" 
          value={stats?.reportsToday?.toString() || "0"} 
          subValue={`Quota: ${stats?.rateLimit || 3}/user/day`}
          icon={Zap}
          color="text-amber-500"
          trend="Real-time tracking"
        />
        <div className="p-8 bg-white dark:bg-[#161B27] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Brain size={80} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Token Quota</p>
              <Activity size={16} className={tokenQuotaPercent > 80 ? 'text-rose-500 animate-pulse' : 'text-teal-500'} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black">{(stats?.tokensToday / 1000000).toFixed(2)}M</p>
              <p className="text-xs font-bold text-slate-400">/ 3.5M</p>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${tokenQuotaPercent}%` }}
                  className={`h-full ${tokenQuotaPercent > 90 ? 'bg-rose-500' : tokenQuotaPercent > 70 ? 'bg-amber-500' : 'bg-teal-500'}`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                <span>Usage: {tokenQuotaPercent.toFixed(1)}%</span>
                <span>Reset in 14h</span>
              </div>
            </div>
          </div>
        </div>
        <KPIBox 
          label="Estimated API Spend" 
          value={`₹${(stats?.costToday || 0).toLocaleString()}`} 
          subValue="Calculated daily overhead"
          icon={IndianRupee}
          color="text-emerald-500"
          trend="Budget: ₹500/day"
        />
      </div>

      {/* Cost Chart */}
      <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="text-teal-500" size={24} />
            Token Usage Trends
          </h2>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500" /> Tokens Used</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Daily Quota</div>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-[#1E2536] p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{payload[0].payload.date}</p>
                        <p className="text-sm font-black text-teal-500">Tokens: {(payload[0].value/1000000).toFixed(2)}M</p>
                        <p className="text-xs font-bold text-emerald-500">Est. Cost: ₹{payload[0].payload.cost.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="tokens" stroke="#00D4AA" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
              <ReferenceLine y={3500000} stroke="#FBBF24" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rate Limit Config Bar */}
      <div className="bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 rounded-[2rem] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-bold">Global Rate Limiting</h3>
            <p className="text-xs text-slate-500">Max reports per user per day immediately applies to all accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="number" 
            value={maxReports}
            onChange={(e) => setMaxReports(parseInt(e.target.value))}
            className="w-20 p-3 bg-white dark:bg-slate-800 rounded-xl text-center font-bold outline-none border border-teal-500/20 focus:ring-2 focus:ring-teal-500"
          />
          <button 
            onClick={updateRateLimit}
            disabled={actionLoading}
            className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all disabled:opacity-50"
          >
            {actionLoading ? "Updating..." : "Update Limit"}
          </button>
        </div>
      </div>

      {/* Main Content: Table & Tabs */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            {["All", "SUCCESS", "FAILED", "PROCESSING"].map(s => (
              <button 
                key={s} 
                onClick={() => { setSelectedStatus(s); setPage(1); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedStatus === s ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s === 'SUCCESS' ? 'Succeeded' : s === 'FAILED' ? 'Failed' : s === 'PROCESSING' ? 'Active' : 'All Logs'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, Name or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 w-64"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#1E2536]/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="py-5 px-6">User</th>
                  <th className="py-5 px-6">Generated At</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6">Tokens</th>
                  <th className="py-5 px-6">Cost</th>
                  <th className="py-5 px-6">Report ID</th>
                  <th className="py-5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {reports.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                          {report.user.avatar ? <img src={report.user.avatar} className="w-full h-full object-cover" /> : (report.user.name?.charAt(0) || "?")}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate max-w-[120px]">{report.user.name || "Anonymous"}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{report.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(report.date).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-500">{new Date(report.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-4 px-6 text-xs font-mono font-bold text-slate-500">{(report.tokens || 0).toLocaleString()}</td>
                    <td className="py-4 px-6 text-xs font-mono font-bold text-emerald-500">₹{(report.cost || 0).toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">#{report.id.slice(-8)}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedReport(report); setIsPanelOpen(true); }}
                          className="p-2 text-slate-400 hover:text-teal-500 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        {report.status === 'FAILED' && (
                          <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteReport(report.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Showing {(page-1)*25 + 1} to {Math.min(page*25, total)} of {total} reports</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={page * 25 >= total}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Stale Report Cleanup */}
      <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Stale Report Cleanup</h3>
            <p className="text-sm text-slate-500">Permanently delete old forensic data to save database storage.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-[#161B27] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400">Reports older than (days)</label>
            <input 
              type="number" 
              value={cleanupDays}
              onChange={(e) => setCleanupDays(parseInt(e.target.value))}
              className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border-none rounded-xl outline-none font-bold text-sm"
            />
          </div>
          <div className="px-8 border-x border-slate-100 dark:border-slate-800 hidden md:block">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Impact</p>
            <p className="text-lg font-bold text-red-500">~124 reports</p>
          </div>
          <button 
            onClick={cleanupReports}
            disabled={actionLoading}
            className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {actionLoading ? "Processing..." : "Confirm Cleanup"}
          </button>
        </div>
      </div>

      {/* Report Viewer Panel */}
      {/* Report Viewer Panel (Forensic Dossier Style) */}
      <AnimatePresence>
        {isPanelOpen && selectedReport && (
          <div className="fixed inset-0 z-[120] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-[#FCFCFD] dark:bg-[#0A0C10] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              {/* Dossier Header */}
              <div className="p-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0A0C10] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none rotate-12">
                  <Shield size={200} />
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 shadow-2xl">
                    <Brain size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded">Confidential</span>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dossier #{selectedReport.id.slice(-8)}</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight dark:text-white uppercase">Forensic Analysis</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPanelOpen(false)} 
                  className="w-12 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors relative z-10"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                {/* Subject Identification */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <UserIcon size={12} /> Subject Identification
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-8 bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                        {selectedReport.user.avatar ? <img src={selectedReport.user.avatar} className="w-full h-full object-cover" /> : selectedReport.user.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{selectedReport.user.name || "Anonymous User"}</p>
                        <p className="text-[10px] font-bold text-slate-500">{selectedReport.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <p className="text-[10px] font-black uppercase text-slate-400">Timestamp</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {new Date(selectedReport.date).toLocaleDateString()} at {new Date(selectedReport.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Parameters */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Compute Cost</p>
                    <p className="text-lg font-black text-emerald-500">₹{selectedReport.cost.toFixed(4)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tokens Burned</p>
                    <p className="text-lg font-black text-blue-500">{selectedReport.tokens.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Status Code</p>
                    <p className={`text-lg font-black ${selectedReport.status === 'SUCCESS' ? 'text-teal-500' : 'text-rose-500'}`}>{selectedReport.status}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                {/* Report Findings */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Search size={12} /> Findings & Anomalies
                  </h3>
                  
                  {selectedReport.status === 'SUCCESS' ? (
                    <div className="space-y-6">
                      {(() => {
                        try {
                          const data = JSON.parse(selectedReport.content || "{}");
                          return Object.entries(data).map(([key, val]: any) => (
                            <motion.section 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={key} 
                              className="p-8 bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                            >
                              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                              <h3 className="text-xs font-black uppercase text-teal-600 dark:text-teal-400 mb-4 tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={14} />
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                {val}
                              </p>
                            </motion.section>
                          ));
                        } catch {
                          return (
                            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                              <AlertTriangle className="mx-auto text-amber-500 mb-4" size={32} />
                              <p className="text-sm font-bold text-slate-500 italic">Report data is not in standard forensic JSON format.</p>
                              <pre className="mt-4 p-4 bg-slate-900 text-slate-300 text-[10px] rounded-xl overflow-auto text-left">
                                {selectedReport.content}
                              </pre>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="p-12 text-center space-y-6 bg-rose-500/5 rounded-[2rem] border-2 border-dashed border-rose-500/20">
                      <XCircle className="mx-auto text-rose-500" size={64} />
                      <div>
                        <h3 className="text-xl font-black text-rose-500 uppercase tracking-tight">Intelligence Failure</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">"{selectedReport.error || "A critical API error prevented report generation."}"</p>
                      </div>
                      <button className="px-8 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase shadow-xl shadow-rose-500/20">
                        Retry Generation
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dossier Footer Actions */}
              <div className="p-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0C10] flex gap-4">
                <button 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <IndianRupee size={16} /> Audit Cost
                </button>
                <button 
                  onClick={() => deleteReport(selectedReport.id)}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/30 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Shred Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KPIBox({ label, value, subValue, icon: Icon, color, trend }: any) {
  return (
    <div className="p-8 bg-white dark:bg-[#161B27] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4 relative overflow-hidden group">
      <div className="flex justify-between items-center relative z-10">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <div className={`w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase">{subValue}</p>
      </div>
      {trend && (
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">{trend}</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUCCESS: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    FAILED: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    PROCESSING: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${styles[status]}`}>
      {status === 'PROCESSING' && <RefreshCw size={10} className="animate-spin" />}
      {status === 'SUCCESS' && <CheckCircle2 size={10} />}
      {status === 'FAILED' && <XCircle size={10} />}
      {status}
    </span>
  );
}
