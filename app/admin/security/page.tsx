"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  Lock, 
  Ban, 
  FileText, 
  AlertOctagon, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Unlock, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Activity,
  History,
  AlertTriangle,
  ExternalLink,
  ShieldX,
  Plus,
  RefreshCw,
  Eye,
  Info,
  Clock,
  Globe,
  X
} from "lucide-react";

interface Alert {
  id: string;
  type: string;
  severity: string;
  description: string;
  createdAt: string;
  status: string;
  user?: { name: string | null; email: string };
}

interface LockedUser {
  id: string;
  name: string | null;
  email: string;
  lockedAt: string;
  lockReason: string | null;
}

interface BlockedIP {
  id: string;
  ip: string;
  note: string | null;
  addedBy: string;
  requests: number;
  createdAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  actionType: string;
  target: string;
  details: string;
  ip: string;
  createdAt: string;
}

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState("alerts");
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lockouts, setLockouts] = useState<LockedUser[]>([]);
  const [blocklist, setBlocklist] = useState<BlockedIP[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  
  // IP Block form
  const [newIP, setNewIP] = useState("");
  const [ipNote, setIpNote] = useState("");

  // User Actions (Unified)
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  
  // Audit Filtering
  const [auditSearch, setAuditSearch] = useState("");
  const [auditType, setAuditType] = useState("All Actions");
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/admin/security/alerts");
    if (res.ok) setAlerts(await res.json());
  }, []);

  const fetchLockouts = useCallback(async () => {
    const res = await fetch("/api/admin/security/lockouts");
    if (res.ok) setLockouts(await res.json());
  }, []);

  const fetchBlocklist = useCallback(async () => {
    const res = await fetch("/api/admin/security/blocklist");
    if (res.ok) setBlocklist(await res.json());
  }, []);

  const fetchAudit = useCallback(async () => {
    const res = await fetch("/api/admin/security/audit");
    if (res.ok) {
      let logs = await res.json();
      
      // Client-side filtering for search and type
      if (auditSearch) {
        logs = logs.filter((l: any) => 
          l.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
          l.adminName.toLowerCase().includes(auditSearch.toLowerCase()) ||
          l.details.toLowerCase().includes(auditSearch.toLowerCase())
        );
      }
      
      if (auditType !== "All Actions") {
        logs = logs.filter((l: any) => l.actionType === auditType);
      }
      
      setAuditLog(logs);
    }
  }, [auditSearch, auditType]);

  useEffect(() => {
    fetchAlerts();
    fetchLockouts();
    fetchBlocklist();
    fetchAudit();
  }, [fetchAlerts, fetchLockouts, fetchBlocklist, fetchAudit]);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');

  const dismissAlert = async (id: string) => {
    const res = await fetch(`/api/admin/security/alerts/${id}/dismiss`, { method: 'PATCH' });
    if (res.ok) fetchAlerts();
  };

  const unlockAccount = async (userId: string) => {
    const reason = prompt("Reason for unlocking?");
    if (!reason) return;
    const pwd = prompt("Confirm Admin Password:");
    if (!pwd) return;
    
    setLoading(true);
    const res = await fetch("/api/admin/security/lockout", {
      method: "POST",
      body: JSON.stringify({ userId, action: 'unlock', reason, adminPassword: pwd })
    });

    if (res.ok) {
      alert("Account unlocked successfully.");
      fetchLockouts();
      fetchAudit();
    } else {
      const data = await res.json();
      alert(data.error || "Unlock failed");
    }
    setLoading(false);
  };

  const banAccount = async (userId: string) => {
    if (!confirm("Banning is permanent. Continue?")) return;
    const res = await fetch(`/api/admin/security/lockouts/${userId}/ban`, { method: 'PATCH' });
    if (res.ok) fetchLockouts();
  };

  const blockIP = async () => {
    if (!newIP) return;
    const res = await fetch("/api/admin/security/blocklist", {
      method: "POST",
      body: JSON.stringify({ ip: newIP, note: ipNote })
    });
    if (res.ok) {
      setNewIP("");
      setIpNote("");
      fetchBlocklist();
    }
  };

  const unblockIP = async (ip: string) => {
    const res = await fetch(`/api/admin/security/blocklist/${ip}`, { method: 'DELETE' });
    if (res.ok) fetchBlocklist();
  };

  const findUser = async () => {
    if (!searchEmail) return;
    const res = await fetch(`/api/admin/users?search=${searchEmail}`);
    if (res.ok) {
      const users = await res.json();
      setFoundUser(users[0] || null);
    }
  };

  const handleSecurityAction = async (action: 'override' | 'lock' | 'unlock', userId?: string) => {
    const targetId = userId || foundUser?.id;
    if (!targetId || !adminPassword || !overrideReason) {
      alert("Please fill all required fields including admin password and reason.");
      return;
    }
    
    setLoading(true);
    const endpoint = action === 'override' ? '/api/admin/security/2fa-override' : '/api/admin/security/lockout';
    const payload = action === 'override' 
      ? { userId: targetId, adminPassword, reason: overrideReason }
      : { userId: targetId, action, reason: overrideReason, adminPassword };

    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(`${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully.`);
      setFoundUser(null);
      setAdminPassword("");
      setOverrideReason("");
      setSearchEmail("");
      fetchAudit();
      fetchLockouts();
    } else {
      const data = await res.json();
      alert(data.error || "Action failed");
    }
    setLoading(false);
  };

  const exportAuditCSV = () => {
    const headers = ["Timestamp", "Admin", "Action", "Target", "IP", "Details"];
    const rows = auditLog.map(l => [
      new Date(l.createdAt).toLocaleString(),
      l.adminName,
      l.actionType,
      l.target,
      l.ip,
      l.details
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_log_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case "USER_SUSPENDED": return "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
      case "USER_DELETED": return "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      case "2FA_RESET": return "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "IP_BLOCKED": return "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Audit Log Modal */}
      <AnimatePresence>
        {selectedAuditLog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#161B27] rounded-[2.5rem] p-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActionBadgeColor(selectedAuditLog.actionType)}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Audit Details</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{selectedAuditLog.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAuditLog(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#1E2536] rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Admin</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedAuditLog.adminName}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#1E2536] rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">IP Address</p>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{selectedAuditLog.ip}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-[#1E2536] rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Detailed Log</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50">
                    {selectedAuditLog.details}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 px-2">
                  <span>Target: <span className="text-teal-500">{selectedAuditLog.target}</span></span>
                  <span>{new Date(selectedAuditLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedAuditLog(null)}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black uppercase shadow-lg transition-all hover:bg-slate-800"
              >
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Security</h1>
          <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black uppercase rounded-full shadow-lg shadow-rose-500/20">Critical</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">2FA oversight, threat monitoring, audit trail</p>
      </div>

      {/* Alerts Banner */}
      <AnimatePresence>
        {criticalAlerts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-rose-600/20 sticky top-4 z-50"
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              <AlertOctagon size={20} />
              <span>{criticalAlerts.length} critical security alerts require immediate attention.</span>
            </div>
            <button 
              onClick={() => setActiveTab("alerts")}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black uppercase transition-all backdrop-blur-md"
            >
              Jump to alerts
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "alerts", label: "Security alerts", icon: ShieldAlert, count: activeAlerts.length },
          { id: "lockouts", label: "Account lockouts", icon: Lock, count: lockouts.length },
          { id: "blocklist", label: "IP blocklist", icon: ShieldX, count: blocklist.length },
          { id: "audit", label: "Audit log", icon: FileText, count: 0 }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === t.id ? 'text-teal-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <t.icon size={18} />
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {t.count}
              </span>
            )}
            {activeTab === t.id && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "alerts" && (
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-[2rem] border border-dashed border-emerald-200 dark:border-emerald-500/20">
                <ShieldCheck size={48} className="text-emerald-500 mb-4 opacity-50" />
                <p className="text-sm font-bold text-emerald-600">All systems secure. No active alerts.</p>
              </div>
            ) : (
              activeAlerts.map(alert => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  key={alert.id} 
                  className={`bg-white dark:bg-[#161B27] rounded-3xl border ${alert.severity === 'CRITICAL' ? 'border-rose-200 dark:border-rose-900/50 shadow-lg shadow-rose-500/5' : 'border-slate-200 dark:border-slate-800'} p-6 flex items-center justify-between gap-6 group`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {alert.severity === 'CRITICAL' ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${alert.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`}>
                          {alert.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">•</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{alert.description}</p>
                      {alert.user && (
                        <p className="text-xs text-slate-500 mt-1">Impacted user: <span className="text-teal-500 font-bold underline cursor-pointer">{alert.user.email}</span></p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => dismissAlert(alert.id)}
                      className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button className="px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all">
                      Investigate
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === "lockouts" && (
          <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="py-5 px-8">User</th>
                  <th className="py-5 px-8">Locked At</th>
                  <th className="py-5 px-8">Reason</th>
                  <th className="py-5 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {lockouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold italic">No accounts currently locked.</td>
                  </tr>
                ) : (
                  lockouts.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{user.name || "Anonymous"}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-8 text-xs font-bold text-slate-600">{new Date(user.lockedAt).toLocaleString()}</td>
                      <td className="py-4 px-8">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-[10px] font-black uppercase rounded">
                          {user.lockReason || "Multiple failed attempts"}
                        </span>
                      </td>
                      <td className="py-4 px-8 text-right space-x-2">
                        <button 
                          onClick={() => unlockAccount(user.id)}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500/20 transition-all"
                        >
                          Unlock
                        </button>
                        <button 
                          onClick={() => banAccount(user.id)}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600 transition-all"
                        >
                          Permanent Ban
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "blocklist" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Block Form */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Block new IP</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">IP Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 192.168.1.1"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Reason / Note</label>
                    <textarea 
                      placeholder="e.g. Bot scraping detected"
                      value={ipNote}
                      onChange={(e) => setIpNote(e.target.value)}
                      className="w-full h-24 p-4 bg-slate-50 dark:bg-[#1E2536] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>
                  <button 
                    onClick={blockIP}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                  >
                    Block IP Address
                  </button>
                </div>
              </div>
            </div>

            {/* Blocklist Table */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">{blocklist.length} Blocked IPs</h3>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4 px-6">IP Address</th>
                      <th className="py-4 px-6">Added At</th>
                      <th className="py-4 px-6">Note</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {blocklist.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-6 text-sm font-black text-slate-900 dark:text-white">{entry.ip}</td>
                        <td className="py-3 px-6 text-[10px] font-bold text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-6 text-xs text-slate-500 italic">{entry.note || "No note"}</td>
                        <td className="py-3 px-6 text-right">
                          <button 
                            onClick={() => unblockIP(entry.ip)}
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            <Unlock size={16} />
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

        {activeTab === "audit" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search target user or resource..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs font-bold outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value)}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs font-bold outline-none border-none"
                >
                  <option value="All Actions">All Actions</option>
                  <option value="USER_LOCKED">User Locked</option>
                  <option value="USER_UNLOCKED">User Unlocked</option>
                  <option value="2FA_OVERRIDE">2FA Override</option>
                  <option value="IP_BLOCKED">IP Blocked</option>
                  <option value="SETTING_CHANGED">Setting Changed</option>
                </select>
                <button 
                  onClick={exportAuditCSV}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="py-5 px-8">Timestamp</th>
                    <th className="py-5 px-8">Admin</th>
                    <th className="py-5 px-8">Action</th>
                    <th className="py-5 px-8">Target</th>
                    <th className="py-5 px-8">IP</th>
                    <th className="py-5 px-8 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {auditLog.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-8 text-[10px] font-bold text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-4 px-8 text-xs font-black text-slate-700 dark:text-slate-300">{log.adminName}</td>
                      <td className="py-4 px-8">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getActionBadgeColor(log.actionType)}`}>
                          {log.actionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-8 text-xs font-bold text-teal-600">{log.target}</td>
                      <td className="py-4 px-8 text-[10px] font-mono text-slate-400">{log.ip}</td>
                      <td className="py-4 px-8 text-right">
                        <button 
                          onClick={() => setSelectedAuditLog(log)}
                          className="p-2 text-slate-400 hover:text-teal-500 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Security Actions Panel */}
      <div className="bg-slate-900 dark:bg-slate-800/50 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert size={120} />
        </div>
        
        <div className="max-w-4xl relative z-10 space-y-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
              <ShieldCheck size={28} className="text-teal-500" />
              User Security Actions
            </h2>
            <p className="text-slate-400 text-sm font-bold max-w-xl">
              Perform administrative overrides for user security settings. All actions are logged and users will be notified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Search User</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter user email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button 
                    onClick={findUser}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {foundUser && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">{foundUser.name || "User"}</p>
                      <p className="text-[10px] text-slate-400">{foundUser.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">2FA:</span>
                        {foundUser.twoFactorEnabled ? (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-[9px] font-black uppercase rounded">Disabled</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
                        {foundUser.isLocked ? (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black uppercase rounded">Locked</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded">Normal</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Admin Password</label>
                  <input 
                    type="password" 
                    placeholder="Password..."
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Reason</label>
                  <input 
                    type="text" 
                    placeholder="Reason..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleSecurityAction('override')}
                  disabled={loading || !foundUser || !adminPassword || !overrideReason || !foundUser.twoFactorEnabled}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldX size={16} /> Disable 2FA
                </button>
                {foundUser?.isLocked ? (
                  <button 
                    onClick={() => handleSecurityAction('unlock')}
                    disabled={loading || !foundUser || !adminPassword || !overrideReason}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Unlock size={16} /> Unlock
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSecurityAction('lock')}
                    disabled={loading || !foundUser || !adminPassword || !overrideReason}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Lock size={16} /> Lock Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAuditLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#161B27] w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActionBadgeColor(selectedAuditLog.actionType)}`}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Audit Detail</h3>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{selectedAuditLog.actionType.replace('_', ' ')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAuditLog(null)}
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Timestamp</label>
                    <p className="text-sm font-bold">{new Date(selectedAuditLog.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">IP Address</label>
                    <p className="text-sm font-mono font-bold text-teal-500">{selectedAuditLog.ip}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Administrator</label>
                    <p className="text-sm font-bold">{selectedAuditLog.adminName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Target Resource</label>
                    <p className="text-sm font-bold text-rose-500">{selectedAuditLog.target}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Detailed Action Logs</label>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400 italic">
                      "{selectedAuditLog.details}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setSelectedAuditLog(null)}
                  className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
