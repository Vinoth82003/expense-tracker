"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminAlert {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  read: boolean;
}

export function AdminNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/admin/notifications/admin-alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch admin alerts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
    await fetch("/api/admin/notifications/admin-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const markAllRead = async () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
    await fetch("/api/admin/notifications/admin-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
  };

  const clearAll = async () => {
    setAlerts([]);
    await fetch("/api/admin/notifications/admin-alerts", { method: "DELETE" });
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0F1117]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-card)] shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                <p className="text-[10px] text-slate-500 font-medium">System events and alerts</p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="p-1.5 text-slate-400 hover:text-teal-500 transition-colors"
                    title="Mark all as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={clearAll}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                </div>
              ) : alerts.length > 0 ? (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 relative group ${!alert.read ? 'bg-teal-50/30 dark:bg-teal-500/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                          alert.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                          alert.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {alert.type === 'warning' && <AlertTriangle size={14} />}
                          {alert.type === 'success' && <CheckCircle2 size={14} />}
                          {alert.type === 'info' && <Info size={14} />}
                        </div>
                        <div className="flex-1 space-y-1 pr-6">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm font-bold ${!alert.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {alert.title}
                            </p>
                            {!alert.read && (
                              <span className="h-2 w-2 rounded-full bg-teal-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      {!alert.read && (
                        <button 
                          onClick={() => markAsRead(alert.id)}
                          className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm text-slate-400 hover:text-teal-500"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                    <Bell size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">No notifications</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Everything is up to date.</p>
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = "/admin/notifications?tab=alerts";
                  }}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-teal-500 transition-colors"
                >
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
