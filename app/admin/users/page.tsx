"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  UserX, 
  Trash2, 
  Eye, 
  Ban, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  X,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  History,
  FileText,
  ShieldOff,
  User as UserIcon,
  Mail,
  Calendar,
  Activity,
  Globe,
  Lock,
  RefreshCcw,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  expenseMode: string | null;
  twoFactorEnabled: boolean;
  lastActive: string | null;
  createdAt: string;
  isSuspended: boolean;
  suspensionReason: string | null;
}

interface UserDetail extends User {
  _count: {
    expenses: number;
    incomes: number;
    reports: number;
  };
  stats: {
    expenseTotal: number;
    incomeTotal: number;
    budgetHistory: Array<{ month: string, amount: number }>;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, twoFAEnabled: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [search, setSearch] = useState("");
  const [twoFA, setTwoFA] = useState("All");
  const [mode, setMode] = useState("All");
  const [joined, setJoined] = useState("All time");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection & UI State
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        twoFA: twoFA !== "All" ? twoFA : "",
        mode: mode !== "All" ? mode : "",
        joined: joined !== "All time" ? joined : "",
        page: page.toString(),
        limit: "25",
        sortBy,
        sortOrder
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, [search, twoFA, mode, joined, page, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const fetchUserDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch user detail", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        fetchUserDetail(id);
      }
    }
  }, []);

  const handleSuspend = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspensionReason }),
      });
      if (res.ok) {
        setIsSuspendModalOpen(false);
        setSuspensionReason("");
        fetchUserDetail(selectedUser.id);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to suspend user", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || deleteConfirmationEmail !== selectedUser.email) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setDeleteConfirmationEmail("");
        setIsDrawerOpen(false);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset2FA = async () => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to reset 2FA for this user?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-2fa`, {
        method: "PATCH",
      });
      if (res.ok) {
        fetchUserDetail(selectedUser.id);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to reset 2FA", error);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Joined", "Expense Mode", "2FA", "Last Active"];
    const rows = users.map(u => [
      u.name || "Anonymous",
      u.email,
      new Date(u.createdAt).toLocaleDateString(),
      u.expenseMode || "No limit",
      u.twoFactorEnabled ? "On" : "Off",
      u.lastActive ? new Date(u.lastActive).toLocaleString() : "Never"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User management</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">All registered accounts</p>
      </div>

      {/* Stats Strip */}
      <div className="flex flex-wrap gap-4">
        <StatChip label={`${stats.totalUsers.toLocaleString()} total users`} />
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 self-center" />
        <StatChip label={`${stats.activeToday.toLocaleString()} active today`} />
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 self-center" />
        <StatChip label={`${stats.twoFAEnabled.toLocaleString()} with 2FA enabled`} />
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#161B27] p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* 2FA Segmented Control */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {["All", "Enabled", "Disabled"].map(opt => (
              <button
                key={opt}
                onClick={() => setTwoFA(opt)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${twoFA === opt ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {opt === "All" ? "All 2FA" : opt}
              </button>
            ))}
          </div>

          <select 
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
          >
            <option value="All">All Modes</option>
            <option value="Limit">Limit</option>
            <option value="No-limit">No-limit</option>
          </select>

          <select 
            value={joined}
            onChange={(e) => setJoined(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
          >
            <option value="All time">All time</option>
            <option value="Last 7d">Last 7d</option>
            <option value="Last 30d">Last 30d</option>
          </select>

          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 ml-auto lg:ml-0"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-[#161B27] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#1E2536]/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="py-5 px-6 cursor-pointer hover:text-teal-500 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Avatar+Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="py-5 px-6">Email</th>
                <th className="py-5 px-6 cursor-pointer hover:text-teal-500 transition-colors" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-2">Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="py-5 px-6">Expense mode</th>
                <th className="py-5 px-6">2FA status</th>
                <th className="py-5 px-6 cursor-pointer hover:text-teal-500 transition-colors" onClick={() => handleSort('lastActive')}>
                  <div className="flex items-center gap-2">Last login {sortBy === 'lastActive' && (sortOrder === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="py-5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className="group hover:bg-teal-50/30 dark:hover:bg-teal-500/5 transition-colors cursor-pointer"
                  onClick={() => fetchUserDetail(user.id)}
                >
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 overflow-hidden ring-2 ring-transparent group-hover:ring-teal-500/20 transition-all">
                        {user.avatar ? <img src={user.avatar} alt={user.name || ""} className="w-full h-full object-cover" /> : (user.name?.charAt(0) || user.email.charAt(0).toUpperCase())}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {user.name || "Anonymous"}
                          {user.isSuspended && <Ban size={12} className="text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.expenseMode === 'limit' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {user.expenseMode === 'limit' ? 'Limit' : 'No limit'}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.twoFactorEnabled ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {user.twoFactorEnabled ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-400">{user.lastActive ? formatRelativeTime(user.lastActive) : "Never"}</td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition-all" title="View Detail" onClick={() => fetchUserDetail(user.id)}>
                        <Eye size={16} />
                      </button>
                      <button 
                        className={`p-2 transition-all rounded-lg ${user.isSuspended ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`} 
                        title={user.isSuspended ? "Activate" : "Suspend"} 
                        onClick={() => { setSelectedUser(user as any); setIsSuspendModalOpen(true); }}
                      >
                        <Ban size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Delete" onClick={() => { setSelectedUser(user as any); setIsDeleteModalOpen(true); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#1E2536]/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {users.length} of {total} users</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 text-xs font-bold text-slate-600 dark:text-slate-300">Page {page} of {Math.ceil(total / 25) || 1}</span>
            <button 
              disabled={page >= Math.ceil(total / 25)}
              onClick={() => setPage(page + 1)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]" 
            />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-white dark:bg-[#161B27] z-[100] shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto"
            >
              <div className="p-8 space-y-10">
                {/* Drawer Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500 overflow-hidden">
                      {selectedUser.avatar ? <img src={selectedUser.avatar} alt={selectedUser.name || ""} className="w-full h-full object-cover" /> : (selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase())}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {selectedUser.name || "Anonymous"}
                        {selectedUser.isSuspended && <Ban size={16} className="text-red-500" />}
                      </h2>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Profile Section */}
                <DrawerSection title="Profile" icon={UserIcon}>
                  <DetailItem label="Google ID" value={selectedUser.id} />
                  <DetailItem label="Joined Date" value={new Date(selectedUser.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })} />
                  <DetailItem label="Last Login" value={selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : "Never"} />
                  <DetailItem label="Account Status" value={selectedUser.isSuspended ? "Suspended" : "Active"} valueColor={selectedUser.isSuspended ? "text-red-500" : "text-emerald-500"} />
                  {selectedUser.isSuspended && selectedUser.suspensionReason && (
                    <DetailItem label="Reason" value={selectedUser.suspensionReason} />
                  )}
                </DrawerSection>

                {/* Stats Section */}
                <DrawerSection title="Stats" icon={Activity}>
                  <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Total Expenses" count={selectedUser._count.expenses} total={`₹${selectedUser.stats.expenseTotal.toLocaleString()}`} color="text-red-500" />
                    <StatBox label="Total Income" count={selectedUser._count.incomes} total={`+₹${selectedUser.stats.incomeTotal.toLocaleString()}`} color="text-emerald-500" />
                  </div>
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-[#1E2536] rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-purple-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">AI Reports Generated</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser._count.reports}</span>
                  </div>
                </DrawerSection>

                {/* Budget Section */}
                <DrawerSection title="Budget" icon={CreditCard}>
                  <DetailItem label="Current Mode" value={selectedUser.expenseMode === 'limit' ? 'Limit' : 'No limit'} />
                  {selectedUser.expenseMode === 'limit' && (
                    <DetailItem label="Monthly Limit" value={`₹${(selectedUser as any).monthlyLimit?.toLocaleString() || 0}`} />
                  )}
                  {selectedUser.stats.budgetHistory.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History (Last 6m)</p>
                      <div className="bg-slate-50 dark:bg-[#1E2536] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left">
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {selectedUser.stats.budgetHistory.map(h => (
                              <tr key={h.month}>
                                <td className="py-2 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{h.month}</td>
                                <td className="py-2 px-4 text-xs font-bold text-slate-900 dark:text-white text-right">₹{h.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </DrawerSection>

                {/* Security Section */}
                <DrawerSection title="Security" icon={Lock}>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1E2536] rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className={selectedUser.twoFactorEnabled ? "text-emerald-500" : "text-slate-400"} />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Two-Factor Auth</span>
                    </div>
                    <span className={`text-xs font-bold uppercase ${selectedUser.twoFactorEnabled ? "text-emerald-500" : "text-red-500"}`}>
                      {selectedUser.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </DrawerSection>

                {/* Actions Section */}
                <div className="pt-6 space-y-4 border-t border-slate-100 dark:border-slate-800">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1E2536] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3">
                      <Eye size={18} className="text-slate-400 group-hover:text-teal-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">View as this user</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                  <button 
                    onClick={handleReset2FA}
                    disabled={!selectedUser.twoFactorEnabled || actionLoading}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1E2536] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCcw size={18} className="text-slate-400 group-hover:text-teal-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Reset 2FA</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                  <button 
                    onClick={() => setIsSuspendModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Ban size={18} className="text-red-500" />
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{selectedUser.isSuspended ? 'Activate account' : 'Suspend account'}</span>
                    </div>
                    <ChevronRight size={16} className="text-red-300" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-500" />
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">Delete account</span>
                    </div>
                    <ChevronRight size={16} className="text-red-300" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Suspend Modal */}
      <AnimatePresence>
        {isSuspendModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedUser.isSuspended ? 'Activate' : 'Suspend'} {selectedUser.name || "User"}?
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {selectedUser.isSuspended ? "Allow this user to access their account again." : "The user will be immediately logged out and blocked from logging in."}
                  </p>
                </div>
              </div>

              {!selectedUser.isSuspended && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Reason for suspension</label>
                  <textarea 
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    required
                    rows={3}
                    placeholder="e.g., Policy violation, suspicious activity..."
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSuspend}
                  disabled={actionLoading || (!selectedUser.isSuspended && !suspensionReason)}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${selectedUser.isSuspended ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'} disabled:opacity-50`}
                >
                  {actionLoading ? "Processing..." : selectedUser.isSuspended ? "Activate Account" : "Suspend Account"}
                </button>
                <button 
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-[#161B27] border border-red-500/30 dark:border-red-500/20 rounded-[2rem] p-8 shadow-2xl space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Permanently delete account?</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    This will permanently delete all expenses, reports, and data for <strong>{selectedUser.name || "this user"}</strong>. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-red-50 dark:bg-red-500/5 p-4 rounded-2xl border border-red-100 dark:border-red-500/10">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest text-center">Type email to confirm</p>
                <p className="text-xs font-medium text-red-500/70 dark:text-red-400/60 text-center mb-2">{selectedUser.email}</p>
                <input 
                  type="email"
                  value={deleteConfirmationEmail}
                  onChange={(e) => setDeleteConfirmationEmail(e.target.value)}
                  placeholder="Enter user email..."
                  className="w-full p-4 rounded-xl bg-white dark:bg-[#1E2536] border border-red-200 dark:border-red-500/30 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={actionLoading || deleteConfirmationEmail !== selectedUser.email}
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {actionLoading ? "Deleting..." : "Permanently Delete Data"}
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatChip({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
      {label}
    </div>
  );
}

function DrawerSection({ title, icon: Icon, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] font-black">
        <Icon size={14} />
        {title}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function DetailItem({ label, value, valueColor }: { label: string, value: string, valueColor?: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-bold text-right ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, count, total, color }: { label: string, count: number, total: string, color: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-[#1E2536] rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-900 dark:text-white">{count}</span>
        <span className={`text-xs font-bold ${color}`}>{total}</span>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string) {
  const diff = new Date().getTime() - new Date(dateString).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(dateString).toLocaleDateString();
}
