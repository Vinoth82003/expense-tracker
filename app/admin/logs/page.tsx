"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Search, 
  Filter, 
  RefreshCcw, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Calendar,
  Clock,
  User,
  Monitor,
  Activity
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

interface Log {
  id: string;
  level: string;
  service: string;
  message: string;
  details: string | null;
  ip: string | null;
  userId: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
}

export default function LogsPage() {
  const { confirm } = useModal();
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [level, setLevel] = useState("ALL");
  const [service, setService] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [level, service, page]);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/logs?level=${level}&service=${service}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const clearLogs = async (all = false) => {
    const isConfirmed = await confirm({
      title: "Clear Logs",
      message: `Are you sure you want to ${all ? 'clear ALL logs' : 'clear logs older than 30 days'}?`,
      danger: true
    });
    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`/api/admin/logs?all=${all}`, { method: "DELETE" });
      if (res.ok) {
        fetchLogs();
      }
    } catch (error) {
      console.error("Failed to clear logs", error);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "INFO": return <Info size={14} className="text-blue-500" />;
      case "WARN": return <AlertTriangle size={14} className="text-amber-500" />;
      case "ERROR": return <XCircle size={14} className="text-red-500" />;
      case "CRITICAL": return <AlertOctagon size={14} className="text-rose-600" />;
      default: return <Terminal size={14} className="text-[var(--admin-text-muted)]" />;
    }
  };

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "INFO": return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20";
      case "WARN": return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20";
      case "ERROR": return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20";
      case "CRITICAL": return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20";
      default: return "bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-secondary)] border-[var(--admin-border-subtle)]";
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] tracking-tight">System Logs</h1>
          <p className="text-[var(--admin-text-secondary)] font-medium">Real-time platform diagnostics & events</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchLogs()}
            className={`p-3 bg-[var(--admin-bg-card)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-surface-variant)] transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={20} />
          </button>
          <button 
            onClick={() => clearLogs(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Cleanup</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="p-4 bg-[var(--admin-bg-card)] rounded-[1.5rem] border border-[var(--admin-border)] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-[var(--admin-bg-surface-variant)] px-3 py-1.5 rounded-lg border border-[var(--admin-border-subtle)]">
          <Filter size={14} className="text-[var(--admin-text-muted)]" />
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Level:</span>
          <select 
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="bg-transparent text-sm font-bold text-[var(--admin-text-primary)] focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-[var(--admin-bg-surface-variant)] px-3 py-1.5 rounded-lg border border-[var(--admin-border-subtle)]">
          <Monitor size={14} className="text-[var(--admin-text-muted)]" />
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Service:</span>
          <select 
            value={service}
            onChange={(e) => { setService(e.target.value); setPage(1); }}
            className="bg-transparent text-sm font-bold text-[var(--admin-text-primary)] focus:outline-none"
          >
            <option value="ALL">All Services</option>
            <option value="API">API</option>
            <option value="WORKER">Worker</option>
            <option value="AUTH">Auth</option>
            <option value="MAIL">Mail</option>
            <option value="QUEUE">Queue</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] group-focus-within:text-teal-500 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search logs (client-side)..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] rounded-xl text-sm text-[var(--admin-text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest border-b border-[var(--admin-border-subtle)] bg-[var(--admin-bg-surface-variant)]">
                <th className="py-5 px-6">Timestamp</th>
                <th className="py-5 px-6">Level</th>
                <th className="py-5 px-6">Service</th>
                <th className="py-5 px-6">Message</th>
                <th className="py-5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border-subtle)]">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="py-8 px-6">
                        <div className="h-4 bg-[var(--admin-bg-surface-variant)] rounded-full w-full" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-[var(--admin-text-muted)]">
                        <Terminal size={48} className="opacity-20" />
                        <p className="font-bold">No system logs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-[var(--admin-bg-surface-variant)] transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-[var(--admin-text-muted)]" />
                          <span className="text-xs font-bold text-[var(--admin-text-secondary)]">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-[var(--admin-text-muted)] opacity-60">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getLevelStyles(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-secondary)] rounded-md text-[10px] font-bold tracking-widest uppercase border border-[var(--admin-border-subtle)]">
                          {log.service}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-[var(--admin-text-primary)] line-clamp-1 group-hover:line-clamp-none transition-all">
                          {log.message}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {log.details && (
                          <button className="text-[10px] font-bold text-teal-500 uppercase hover:underline">
                            View JSON
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="p-6 border-t border-[var(--admin-border-subtle)] flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
              Total logs: <span className="text-[var(--admin-text-primary)]">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-4">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 bg-[var(--admin-bg-surface-variant)] rounded-lg text-[var(--admin-text-secondary)] disabled:opacity-30 transition-all hover:bg-[var(--admin-border-subtle)]"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-[var(--admin-text-secondary)]">
                Page {page} of {pagination.pages}
              </span>
              <button 
                disabled={page === pagination.pages}
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                className="p-2 bg-[var(--admin-bg-surface-variant)] rounded-lg text-[var(--admin-text-secondary)] disabled:opacity-30 transition-all hover:bg-[var(--admin-border-subtle)]"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLog(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--admin-bg-card)] rounded-[2.5rem] border border-[var(--admin-border)] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider mb-2 ${getLevelStyles(selectedLog.level)}`}>
                      {getLevelIcon(selectedLog.level)}
                      {selectedLog.level} Level
                    </div>
                    <h3 className="text-xl font-bold text-[var(--admin-text-primary)] leading-tight">
                      {selectedLog.message}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="p-2 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-muted)] rounded-full hover:scale-110 transition-transform"
                  >
                    <ChevronLeft className="rotate-180" size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
                      <Monitor size={12} />
                      Origin Service
                    </div>
                    <p className="text-sm font-bold text-[var(--admin-text-secondary)]">{selectedLog.service}</p>
                  </div>
                  <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
                      <Calendar size={12} />
                      Occurrence
                    </div>
                    <p className="text-sm font-bold text-[var(--admin-text-secondary)]">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
                      <Activity size={12} />
                      Network IP
                    </div>
                    <p className="text-sm font-bold text-[var(--admin-text-secondary)]">{selectedLog.ip || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">
                      <User size={12} />
                      Trigger User
                    </div>
                    <p className="text-sm font-bold text-[var(--admin-text-secondary)] font-mono">{selectedLog.userId || "System"}</p>
                  </div>
                </div>

                {selectedLog.details && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest">Extended Metadata (JSON)</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedLog.details || "")}
                        className="text-[10px] font-bold text-teal-500 uppercase hover:underline"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                    <div className="p-6 bg-[var(--admin-bg-primary)] rounded-3xl overflow-x-auto border border-[var(--admin-border)]">
                      <pre className="text-xs text-teal-400 font-mono leading-relaxed">
                        {selectedLog.details.startsWith('{') 
                          ? JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                          : selectedLog.details
                        }
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
