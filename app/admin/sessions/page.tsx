"use client";

import { useEffect, useState, useCallback, type ReactNode, type ComponentType } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  History,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Lock,
  ArrowRight,
  ShieldAlert,
  RefreshCcw,
  X,
  Info,
} from "lucide-react";

const PAGE_SIZE = 25;

interface UserSummary {
  name: string | null;
  email?: string;
  avatar: string | null;
}

interface Session {
  id: string;
  userId: string;
  user: { name: string | null; email: string; avatar: string | null };
  device: string;
  browser: string;
  ip: string;
  location: string | null;
  expires: string;
  createdAt: string;
  status: "active" | "expired";
  isApproxLocation?: boolean;
  isSuspicious?: boolean;
}

interface OTPLog {
  id: string;
  userId: string | null;
  user: { name: string | null; avatar: string | null } | null;
  email: string;
  status: string;
  ip: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  isBruteForce?: boolean;
}

interface LoginHistoryItem {
  id: string;
  userId: string;
  user: UserSummary;
  method: string;
  status: string;
  ip: string;
  device: string;
  browser: string;
  createdAt: string;
}

type Tab = "sessions" | "otp" | "history";

export default function AdminSessionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [otpLogs, setOtpLogs] = useState<OTPLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [otpStatus, setOtpStatus] = useState("All");
  const [historyStatus, setHistoryStatus] = useState("All");
  const [methodFilter, setMethodFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [detailItem, setDetailItem] = useState<LoginHistoryItem | null>(null);

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: String(PAGE_SIZE) });
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      let endpoint = "/api/admin/sessions/active";
      if (activeTab === "otp") {
        endpoint = "/api/admin/otp-log";
        if (otpStatus !== "All") params.set("status", otpStatus);
      } else if (activeTab === "history") {
        endpoint = "/api/admin/login-history";
        if (historyStatus !== "All") params.set("status", historyStatus);
        if (methodFilter.trim()) params.set("method", methodFilter.trim());
      }

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = await res.json();

      if (activeTab === "sessions") setSessions(data.items ?? []);
      else if (activeTab === "otp") setOtpLogs(data.items ?? []);
      else setLoginHistory(data.items ?? []);

      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch data", error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search, page, otpStatus, historyStatus, methodFilter, from, to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const suspiciousCount =
    sessions.filter((s) => s.isSuspicious).length + otpLogs.filter((o) => o.isBruteForce).length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] tracking-tight">Sessions & authentication</h1>
        <p className="text-[var(--admin-text-secondary)] font-medium">Active sessions, OTP audit, and login history</p>
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
              <p className="font-bold text-sm">{suspiciousCount} suspicious event(s) detected on this page — review the highlighted rows.</p>
            </div>
            <Link
              href="/admin/security"
              className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
            >
              View alerts
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex p-1 bg-[var(--admin-bg-surface-variant)] rounded-2xl w-fit" role="tablist" aria-label="Sessions and authentication views">
        <TabButton active={activeTab === "sessions"} onClick={() => changeTab("sessions")} icon={Smartphone} label="Active sessions" />
        <TabButton active={activeTab === "otp"} onClick={() => changeTab("otp")} icon={Key} label="OTP audit log" />
        <TabButton active={activeTab === "history"} onClick={() => changeTab("history")} icon={History} label="Login history" />
      </div>

      {/* Filter toolbar */}
      <div className="bg-[var(--admin-bg-card)] p-4 rounded-[1.5rem] border border-[var(--admin-border)] shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" size={16} />
          <input
            type="text"
            placeholder={activeTab === "sessions" ? "Search user, IP, device…" : activeTab === "otp" ? "Search user or IP…" : "Search user, IP or device…"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border)] rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-medium text-[var(--admin-text-primary)]"
          />
        </div>

        {activeTab === "otp" && (
          <select
            value={otpStatus}
            onChange={(e) => { setOtpStatus(e.target.value); setPage(1); }}
            aria-label="OTP status filter"
            className="px-4 py-2.5 bg-[var(--admin-bg-surface-variant)] border-none rounded-xl text-sm font-bold outline-none cursor-pointer text-[var(--admin-text-primary)]"
          >
            <option value="All">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        )}

        {activeTab === "history" && (
          <>
            <select
              value={historyStatus}
              onChange={(e) => { setHistoryStatus(e.target.value); setPage(1); }}
              aria-label="Login status filter"
              className="px-4 py-2.5 bg-[var(--admin-bg-surface-variant)] border-none rounded-xl text-sm font-bold outline-none cursor-pointer text-[var(--admin-text-primary)]"
            >
              <option value="All">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="CHALLENGED">Challenged</option>
            </select>
            <input
              type="text"
              placeholder="Method (e.g. google)"
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              aria-label="Login method filter"
              className="px-4 py-2.5 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border)] rounded-xl text-sm font-medium outline-none text-[var(--admin-text-primary)]"
            />
          </>
        )}

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            aria-label="From date"
            className="px-3 py-2.5 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border)] rounded-xl text-xs font-bold outline-none text-[var(--admin-text-primary)]"
          />
          <span className="text-xs font-bold text-[var(--admin-text-muted)]">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            aria-label="To date"
            className="px-3 py-2.5 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border)] rounded-xl text-xs font-bold outline-none text-[var(--admin-text-primary)]"
          />
          {(from || to || search || otpStatus !== "All" || historyStatus !== "All" || methodFilter) && (
            <button
              onClick={() => { setFrom(""); setTo(""); setSearch(""); setOtpStatus("All"); setHistoryStatus("All"); setMethodFilter(""); setPage(1); }}
              className="p-2.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] bg-[var(--admin-bg-surface-variant)] rounded-xl transition-colors"
              title="Clear filters"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 text-[var(--admin-text-muted)] hover:text-teal-500 bg-[var(--admin-bg-surface-variant)] rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {activeTab === "sessions" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
                {total.toLocaleString()} session(s)
              </span>
            </div>

            <div className="flex items-start gap-3 mb-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-surface-variant)] px-4 py-3 text-xs font-medium text-[var(--admin-text-muted)]">
              <Info size={16} className="mt-0.5 shrink-0 text-[var(--admin-accent)]" />
              <span>
                Sessions here are informational. This app authenticates with signed tokens, so a single
                session cannot be signed out remotely. To cut a user&apos;s access immediately,{" "}
                <Link
                  href="/admin/security?tab=lockouts"
                  className="font-bold text-[var(--admin-accent)] underline-offset-2 hover:underline"
                >
                  lock their account
                </Link>
                .
              </span>
            </div>

            <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest border-b border-[var(--admin-border-subtle)]">
                      <th className="py-5 px-6">User</th>
                      <th className="py-5 px-6">Email</th>
                      <th className="py-5 px-6">Device/Browser</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Location</th>
                      <th className="py-5 px-6">State</th>
                      <th className="py-5 px-6">Started</th>
                      <th className="py-5 px-6">Expires</th>
                      <th className="py-5 px-6 text-right">Revoke access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                    <StateRows
                      loading={loading && sessions.length === 0}
                      error={loadError}
                      empty={!loading && sessions.length === 0}
                      emptyLabel="No sessions match these filters."
                      colSpan={9}
                      onRetry={fetchData}
                    >
                      {sessions.map((session) => (
                        <tr
                          key={session.id}
                          className={`group transition-colors ${session.isSuspicious ? "bg-amber-500/5 dark:bg-amber-500/10" : "hover:bg-[var(--admin-bg-surface-variant)]"}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-surface-variant)] flex items-center justify-center text-xs font-bold text-[var(--admin-text-secondary)] overflow-hidden">
                                {session.user.avatar ? <img src={session.user.avatar} alt="" className="w-full h-full object-cover" /> : (session.user.name?.charAt(0) || "?")}
                              </div>
                              <span className="text-sm font-bold text-[var(--admin-text-primary)]">
                                {session.user.name || "Anonymous"}
                                {session.isSuspicious && <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded-full">Review</span>}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-medium text-[var(--admin-text-secondary)]">{session.user.email}</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[var(--admin-text-primary)]">{session.device}</span>
                              <span className="text-[10px] text-[var(--admin-text-muted)] font-medium">{session.browser}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-mono text-[var(--admin-text-secondary)]">{session.ip}</td>
                          <td className="py-4 px-6">
                            <div
                              className="flex items-center gap-1 text-xs font-medium text-[var(--admin-text-secondary)]"
                              title={session.isApproxLocation ? "Approximate location, derived from the IP address" : undefined}
                            >
                              <MapPin size={12} className="text-[var(--admin-text-muted)]" />
                              {session.location || "Unknown"}
                              {session.isApproxLocation && <span className="text-[9px] font-bold uppercase text-[var(--admin-text-muted)]">approx.</span>}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${session.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-muted)]"}`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs font-bold text-[var(--admin-text-muted)]">{new Date(session.createdAt).toLocaleString()}</td>
                          <td className="py-4 px-6 text-xs font-bold text-[var(--admin-text-muted)]">{new Date(session.expires).toLocaleString()}</td>
                           <td className="py-4 px-6 text-right">
                             <Link
                               href={`/admin/security?tab=lockouts&search=${encodeURIComponent(session.user.email)}`}
                               className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--admin-text-muted)] transition-all hover:bg-[var(--admin-bg-surface-variant)] hover:text-amber-500"
                               title="Lock this account (signed JWTs cannot be revoked remotely)"
                             >
                               <Lock size={14} /> Lock account
                             </Link>
                           </td>
                        </tr>
                      ))}
                    </StateRows>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "otp" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-[var(--admin-text-muted)]">
              <Info size={14} />
              Destination addresses are masked and one-time codes are never stored or shown.
            </div>
            <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest border-b border-[var(--admin-border-subtle)]">
                      <th className="py-5 px-6">User</th>
                      <th className="py-5 px-6">Destination</th>
                      <th className="py-5 px-6">Sent At</th>
                      <th className="py-5 px-6">Expires At</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6 text-right">Attempt #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                    <StateRows
                      loading={loading && otpLogs.length === 0}
                      error={loadError}
                      empty={!loading && otpLogs.length === 0}
                      emptyLabel="No OTP activity matches these filters."
                      colSpan={7}
                      onRetry={fetchData}
                    >
                      {otpLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={`transition-colors ${
                            log.status === "FAILED" ? "bg-red-500/5 dark:bg-red-500/10" :
                            log.status === "EXPIRED" ? "bg-amber-500/5 dark:bg-amber-500/10" :
                            "hover:bg-[var(--admin-bg-surface-variant)]"
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-surface-variant)] flex items-center justify-center text-xs font-bold text-[var(--admin-text-secondary)] overflow-hidden">
                                {log.user?.avatar ? <img src={log.user.avatar} alt="" className="w-full h-full object-cover" /> : (log.user?.name?.charAt(0) || "?")}
                              </div>
                              <span className="text-sm font-bold text-[var(--admin-text-primary)]">
                                {log.user?.name || "Anonymous"}
                                {log.isBruteForce && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full">Brute Force Alert</span>}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-mono text-[var(--admin-text-secondary)]" title="Masked for privacy">{log.email}</td>
                          <td className="py-4 px-6 text-xs font-bold text-[var(--admin-text-muted)]">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-4 px-6 text-xs font-bold text-[var(--admin-text-muted)]">{new Date(log.expiresAt).toLocaleString()}</td>
                          <td className="py-4 px-6 text-xs font-mono text-[var(--admin-text-secondary)]">{log.ip}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {log.status === "SUCCESS" && <CheckCircle2 size={14} className="text-emerald-500" />}
                              {log.status === "FAILED" && <XCircle size={14} className="text-red-500" />}
                              {log.status === "EXPIRED" && <Clock size={14} className="text-amber-500" />}
                              <span className={`text-[10px] font-black uppercase ${
                                log.status === "SUCCESS" ? "text-emerald-500" :
                                log.status === "FAILED" ? "text-red-500" :
                                "text-amber-500"
                              }`}>{log.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right text-xs font-bold text-[var(--admin-text-secondary)]">{log.attempts}</td>
                        </tr>
                      ))}
                    </StateRows>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest border-b border-[var(--admin-border-subtle)]">
                      <th className="py-5 px-6">User</th>
                      <th className="py-5 px-6">Method</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6">Timestamp</th>
                      <th className="py-5 px-6">IP Address</th>
                      <th className="py-5 px-6">Device</th>
                      <th className="py-5 px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                    <StateRows
                      loading={loading && loginHistory.length === 0}
                      error={loadError}
                      empty={!loading && loginHistory.length === 0}
                      emptyLabel="No login attempts match these filters."
                      colSpan={7}
                      onRetry={fetchData}
                    >
                      {loginHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--admin-bg-surface-variant)] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-surface-variant)] flex items-center justify-center text-xs font-bold text-[var(--admin-text-secondary)] overflow-hidden">
                                {item.user.avatar ? <img src={item.user.avatar} alt="" className="w-full h-full object-cover" /> : (item.user.name?.charAt(0) || "?")}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[var(--admin-text-primary)]">{item.user.name || "Anonymous"}</p>
                                <p className="text-[10px] font-medium text-[var(--admin-text-muted)]">{item.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-lg">{item.method}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-black uppercase ${statusColor(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="py-4 px-6 text-xs font-bold text-[var(--admin-text-muted)]">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="py-4 px-6 text-xs font-mono text-[var(--admin-text-secondary)]">{item.ip}</td>
                          <td className="py-4 px-6 text-xs font-medium text-[var(--admin-text-secondary)]">{item.device}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => setDetailItem(item)}
                              className="p-2 text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors"
                              title="View attempt details"
                            >
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </StateRows>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !loadError && total > 0 && (
        <div className="flex items-center justify-between bg-[var(--admin-bg-surface-variant)] px-6 py-4 rounded-2xl border border-[var(--admin-border-subtle)]">
          <p className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
            Showing {activeTab === "sessions" ? sessions.length : activeTab === "otp" ? otpLogs.length : loginHistory.length} of {total.toLocaleString()} · Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text-secondary)] disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text-secondary)] disabled:opacity-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Login attempt detail modal — no tokens or secrets, ever. */}
      <AnimatePresence>
        {detailItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-[2rem] p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Login attempt</h3>
                  <p className="text-xs font-medium text-[var(--admin-text-secondary)]">{detailItem.user.email}</p>
                </div>
                <button onClick={() => setDetailItem(null)} className="p-1.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <DetailRow label="User" value={detailItem.user.name || "Anonymous"} />
                <DetailRow label="Method" value={detailItem.method} />
                <DetailRow label="Status" value={detailItem.status} />
                <DetailRow label="Timestamp" value={new Date(detailItem.createdAt).toLocaleString()} />
                <DetailRow label="IP address" value={detailItem.ip} />
                <DetailRow label="Device" value={detailItem.device} />
                <DetailRow label="Browser" value={detailItem.browser} />
              </div>
              <p className="text-[10px] font-medium text-[var(--admin-text-muted)]">
                Session tokens, cookies and credentials are never included in this view.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function statusColor(status: string): string {
  if (status === "SUCCESS") return "text-emerald-500";
  if (status === "FAILED") return "text-red-500";
  if (status === "BLOCKED") return "text-red-600";
  if (status === "CHALLENGED") return "text-amber-500";
  return "text-[var(--admin-text-secondary)]";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-border-subtle)] pb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-text-muted)]">{label}</span>
      <span className="text-xs font-bold text-[var(--admin-text-primary)] text-right break-all">{value}</span>
    </div>
  );
}

function StateRows({
  loading,
  error,
  empty,
  emptyLabel,
  colSpan,
  onRetry,
  children,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyLabel: string;
  colSpan: number;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <RefreshCcw size={28} className="inline-block text-[var(--admin-text-muted)] opacity-50 animate-spin" />
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[var(--admin-text-muted)]">Loading…</p>
        </td>
      </tr>
    );
  }
  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <ShieldAlert size={28} className="inline-block text-amber-500 opacity-70" />
          <p className="mt-3 text-sm font-bold text-amber-600">Could not load this view.</p>
          <button onClick={onRetry} className="mt-3 px-4 py-2 bg-[var(--admin-bg-surface-variant)] rounded-lg text-xs font-bold text-[var(--admin-text-primary)] hover:bg-[var(--admin-border-subtle)] transition-colors">
            Retry
          </button>
        </td>
      </tr>
    );
  }
  if (empty) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <Shield size={28} className="inline-block text-[var(--admin-text-muted)] opacity-50" />
          <p className="mt-3 text-sm font-bold text-[var(--admin-text-secondary)]">{emptyLabel}</p>
        </td>
      </tr>
    );
  }
  return <>{children}</>;
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: ComponentType<{ size?: number }>; label: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
        active
          ? "bg-[var(--admin-bg-card)] text-teal-600 dark:text-teal-400 shadow-sm"
          : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
