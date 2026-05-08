"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Smartphone, 
  Globe, 
  History, 
  Key, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical,
  LogOut,
  MapPin,
  Laptop,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

interface User {
  name: string | null;
  email: string;
  avatar: string | null;
}

interface Session {
  id: string;
  userId: string;
  user: User;
  device: string;
  browser: string;
  ip: string;
  location: string | null;
  expires: string;
  createdAt: string;
  isSuspicious?: boolean;
}

interface OTPLog {
  id: string;
  userId: string | null;
  user: User | null;
  email: string;
  status: string;
  ip: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  isBruteForce?: boolean;
}

interface LoginHistory {
  id: string;
  userId: string;
  user: User;
  method: string;
  status: string;
  ip: string;
  device: string;
  browser: string;
  createdAt: string;
}

export default function AdminSessionsPage() {
  const { confirm } = useModal();
  const [activeTab, setActiveTab] = useState<"sessions" | "otp" | "history">("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [otpLogs, setOtpLogs] = useState<OTPLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "sessions") {
        const res = await fetch("/api/admin/sessions/active");
        if (res.ok) setSessions(await res.json());
      } else if (activeTab === "otp") {
        const res = await fetch(`/api/admin/otp-log?status=${statusFilter}`);
        if (res.ok) setOtpLogs(await res.json());
      } else if (activeTab === "history") {
        const res = await fetch("/api/admin/login-history");
        if (res.ok) setLoginHistory(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revokeSession = async (id: string) => {
    const isConfirmed = await confirm({
      title: "End Session",
      message: "Are you sure you want to end this session?",
      danger: true
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/sessions/active?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to revoke session", error);
    }
  };

  const revokeAllSessions = async (userId?: string) => {
    const msg = userId ? "Revoke all sessions for this user?" : "Revoke ALL active sessions for ALL users?";
    const isConfirmed = await confirm({
      title: "Revoke Sessions",
      message: msg,
      danger: true
    });
    if (!isConfirmed) return;
    try {
      const url = userId ? `/api/admin/sessions/active?userId=${userId}` : `/api/admin/sessions/active?all=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to revoke sessions", error);
    }
  };

  const suspiciousCount = sessions.filter(s => s.isSuspicious).length + otpLogs.filter(o => o.isBruteForce).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Sessions & authentication</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Active sessions, OTP history, login audit</p>
      </div>

      {/* Suspicious Activity Banner */}
      <AnimatePresence>
        {suspiciousCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-4 z-40 p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="animate-pulse" />
              <p className="font-bold text-sm">{suspiciousCount} suspicious events detected — Review now</p>
            </div>
            <button className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
              View alerts
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <TabButton active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} icon={Smartphone} label="Active sessions" />
        <TabButton active={activeTab === "otp"} onClick={() => setActiveTab("otp")} icon={Key} label="OTP log" />
        <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={History} label="Login history" />
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {activeTab === "sessions" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{sessions.length} active sessions</span>
                <button 
                  onClick={() => revokeAllSessions()}
                  className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Revoke all sessions
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-[#1E2536]/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="py-5 px-6">User</th>
                      <th className="py-5 px-6">Email</th>
                      <th className="py-5 px-6">Device/Browser</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Location</th>
                      <th className="py-5 px-6">Session Started</th>
                      <th className="py-5 px-6">Expires</th>
                      <th className="py-5 px-6 text-right">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {sessions.map((session) => (
                      <tr 
                        key={session.id} 
                        className={`group transition-colors ${session.isSuspicious ? 'bg-amber-500/5 dark:bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                              {session.user.avatar ? <img src={session.user.avatar} className="w-full h-full object-cover" /> : (session.user.name?.charAt(0) || "?")}
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                              {session.user.name || "Anonymous"}
                              {session.isSuspicious && <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded-full">New Location</span>}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">{session.user.email}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{session.device}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{session.browser}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-mono text-slate-500 dark:text-slate-400">{session.ip}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <MapPin size={12} className="text-slate-400" />
                            {session.location || "Unknown"}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">{new Date(session.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">{new Date(session.expires).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => revokeSession(session.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <LogOut size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "otp" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search user or IP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-medium"
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-[#1E2536]/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="py-5 px-6">User</th>
                      <th className="py-5 px-6">Email</th>
                      <th className="py-5 px-6">Sent At</th>
                      <th className="py-5 px-6">Expires At</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6 text-right">Attempt #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {otpLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className={`transition-colors ${
                          log.status === 'FAILED' ? 'bg-red-500/5 dark:bg-red-500/10' : 
                          log.status === 'EXPIRED' ? 'bg-amber-500/5 dark:bg-amber-500/10' : 
                          'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                              {log.user?.avatar ? <img src={log.user.avatar} className="w-full h-full object-cover" /> : (log.user?.name?.charAt(0) || "?")}
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                              {log.user?.name || "Anonymous"}
                              {log.isBruteForce && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full">Brute Force Alert</span>}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">{log.email}</td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">{new Date(log.expiresAt).toLocaleString()}</td>
                        <td className="py-4 px-6 text-xs font-mono text-slate-500 dark:text-slate-400">{log.ip}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {log.status === 'SUCCESS' && <CheckCircle2 size={14} className="text-emerald-500" />}
                            {log.status === 'FAILED' && <XCircle size={14} className="text-red-500" />}
                            {log.status === 'EXPIRED' && <Clock size={14} className="text-amber-500" />}
                            <span className={`text-[10px] font-black uppercase ${
                              log.status === 'SUCCESS' ? 'text-emerald-500' : 
                              log.status === 'FAILED' ? 'text-red-500' : 
                              'text-amber-500'
                            }`}>{log.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-xs font-bold text-slate-600 dark:text-slate-400">
                          {log.attempts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-[#1E2536]/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="py-5 px-6">User</th>
                      <th className="py-5 px-6">Method</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6">Timestamp</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Device</th>
                      <th className="py-5 px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {loginHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                              {item.user.avatar ? <img src={item.user.avatar} className="w-full h-full object-cover" /> : (item.user.name?.charAt(0) || "?")}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{item.user.name || "Anonymous"}</p>
                              <p className="text-[10px] font-medium text-slate-500">{item.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-lg">{item.method}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-black uppercase ${item.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>{item.status}</span>
                        </td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="py-4 px-6 text-xs font-mono text-slate-500 dark:text-slate-400">{item.ip}</td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-700 dark:text-slate-300">{item.device}</td>
                        <td className="py-4 px-6 text-right">
                          <button className="p-2 text-slate-400 hover:text-teal-500 transition-colors">
                            <ArrowRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
        active 
          ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
