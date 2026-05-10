"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  X,
  User as UserIcon,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  FilterX,
  CheckCircle2,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface User {
  name: string | null;
  email: string;
  avatar: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  category?: string;
  source?: string;
  subcategory?: string;
  note: string | null;
  date: string;
  userId: string;
  user: User;
  isFlagged?: boolean;
}

export default function AdminTransactionsPage() {
  const [activeTab, setActiveTab] = useState<"expenses" | "income">("expenses");
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState<"volume" | "count">("volume");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Detail View
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txContext, setTxContext] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        category: selectedCategory,
        flagged: flaggedOnly.toString(),
        minAmount,
        maxAmount,
        from: dateFrom,
        to: dateTo,
      });
      const endpoint = activeTab === "expenses" ? "/api/admin/expenses" : "/api/admin/income";
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(activeTab === "expenses" ? result.expenses : result.income);
        setTotal(result.total);
        setStats(result.stats);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, selectedCategory, flaggedOnly, minAmount, maxAmount, dateFrom, dateTo]);

  const fetchChartData = async () => {
    try {
      const res = await fetch("/api/admin/category-stats");
      if (res.ok) setChartData(await res.json());
    } catch (error) {
      console.error("Failed to fetch chart data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isChartOpen) fetchChartData();
  }, [isChartOpen]);

  const openDetail = async (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/transactions/${tx.id}/context?type=${activeTab}`);
      if (res.ok) setTxContext(await res.json());
    } catch (error) {
      console.error("Failed to fetch context", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTx || !deleteReason) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions/${selectedTx.id}`, {
        method: "DELETE",
        body: JSON.stringify({ type: activeTab === "expenses" ? "expense" : "income", reason: deleteReason })
      });
      if (res.ok) {
        setIsDrawerOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    } finally {
      setActionLoading(false);
    }
  };

  const categories = useMemo(() => {
    if (activeTab === "expenses") return ["Needs", "Wants"];
    return ["All"]; // Income categories are more fluid
  }, [activeTab]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] tracking-tight">All transactions</h1>
        <p className="text-[var(--admin-text-secondary)] font-medium">Platform-wide expense and income records</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-[var(--admin-bg-surface-variant)] rounded-2xl w-fit">
        <button 
          onClick={() => { setActiveTab("expenses"); setPage(1); }}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "expenses" ? "bg-[var(--admin-bg-card)] text-teal-600 dark:text-teal-400 shadow-sm" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"}`}
        >
          Expenses
        </button>
        <button 
          onClick={() => { setActiveTab("income"); setPage(1); }}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "income" ? "bg-[var(--admin-bg-card)] text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"}`}
        >
          Income
        </button>
      </div>

      {/* Stats Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeTab === "expenses" ? (
          <>
            <StatChip label="Total Logged" value={`₹${(stats?.totalAmount || 0).toLocaleString()}`} color="text-red-500" />
            <StatChip label="Records" value={stats?.recordCount?.toLocaleString() || "0"} color="text-[var(--admin-text-primary)]" />
            <StatChip label="Flagged" value={stats?.flaggedCount?.toString() || "0"} color="text-amber-500" />
            <StatChip label="Avg / User" value="₹10,840" color="text-[var(--admin-text-primary)]" />
          </>
        ) : (
          <>
            <StatChip label="Total Logged" value={`₹${(stats?.totalAmount || 0).toLocaleString()}`} color="text-emerald-500" />
            <StatChip label="Records" value={stats?.recordCount?.toLocaleString() || "0"} color="text-[var(--admin-text-primary)]" />
            <StatChip label="Avg / User" value="₹43,400" color="text-[var(--admin-text-primary)]" />
            <StatChip label="Growth" value="+12%" color="text-emerald-500" />
          </>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 bg-[var(--admin-bg-card)] p-6 rounded-[2rem] border border-[var(--admin-border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search user, note, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--admin-bg-surface-variant)] border-none rounded-xl outline-none text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:ring-2 focus:ring-teal-500 transition-all text-sm font-medium"
            />
          </div>
          
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-primary)] rounded-xl text-sm font-bold outline-none cursor-pointer border-none"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--admin-bg-surface-variant)] rounded-xl border-none">
            <Calendar size={16} className="text-[var(--admin-text-muted)]" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent border-none outline-none text-[var(--admin-text-primary)] text-xs font-bold w-28" />
            <span className="text-[var(--admin-text-muted)] font-bold">-</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent border-none outline-none text-[var(--admin-text-primary)] text-xs font-bold w-28" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-[var(--admin-text-muted)]">Flagged</span>
            <button 
              onClick={() => setFlaggedOnly(!flaggedOnly)}
              className={`w-10 h-6 rounded-full relative transition-colors ${flaggedOnly ? 'bg-red-500' : 'bg-[var(--admin-border)]'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${flaggedOnly ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <button className="p-2.5 bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--admin-bg-surface-variant)] text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-widest border-b border-[var(--admin-border-subtle)]">
                <th className="py-5 px-6">User</th>
                <th className="py-5 px-6">Category</th>
                <th className="py-5 px-6">Subcategory</th>
                <th className="py-5 px-6">Amount</th>
                <th className="py-5 px-6">Date</th>
                <th className="py-5 px-6">Note</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border-subtle)]">
              {data.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => openDetail(tx)}
                  className={`group transition-colors cursor-pointer hover:bg-[var(--admin-bg-surface-variant)] ${tx.isFlagged ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-surface-variant)] flex items-center justify-center text-xs font-bold text-[var(--admin-text-muted)] overflow-hidden">
                        {tx.user.avatar ? <img src={tx.user.avatar} className="w-full h-full object-cover" /> : (tx.user.name?.charAt(0) || "?")}
                      </div>
                      <span className="text-sm font-bold text-[var(--admin-text-primary)] truncate max-w-[120px]">{tx.user.name || "Anonymous"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      (tx.category || tx.source) === 'Needs' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                      (tx.category || tx.source) === 'Wants' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {tx.category || tx.source}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-[var(--admin-bg-surface-variant)] text-[var(--admin-text-secondary)] text-[10px] font-bold rounded-lg truncate max-w-[100px]">
                      {tx.subcategory || "-"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-sm font-bold tabular-nums ${activeTab === 'expenses' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {activeTab === 'expenses' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-[var(--admin-text-muted)]">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <p className="text-xs text-[var(--admin-text-secondary)] truncate max-w-[120px]">{tx.note || "No note"}</p>
                  </td>
                  <td className="py-4 px-6">
                    {tx.isFlagged ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg w-fit border border-amber-500/20" title="Outlier detected">
                        <AlertTriangle size={12} />
                        <span className="text-[10px] font-black uppercase tracking-tight">Flagged</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg w-fit border border-emerald-500/20" title="Regular transaction">
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-black uppercase tracking-tight">Normal</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-[var(--admin-text-muted)] hover:text-teal-500 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--admin-text-secondary)]">Showing {(page-1)*25 + 1} to {Math.min(page*25, total)} of {total} transactions</p>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-lg bg-[var(--admin-bg-card)] border border-[var(--admin-border)] disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            disabled={page * 25 >= total}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-lg bg-[var(--admin-bg-card)] border border-[var(--admin-border)] disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Category Usage Chart */}
      <div className="bg-[var(--admin-bg-card)] rounded-[2rem] border border-[var(--admin-border)] shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsChartOpen(!isChartOpen)}
          className="w-full flex items-center justify-between px-8 py-6 hover:bg-[var(--admin-bg-surface-variant)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="text-teal-500" />
            <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Category Usage Analytics</h2>
          </div>
          {isChartOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        <AnimatePresence>
          {isChartOpen && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="px-8 pb-8"
            >
              <div className="flex justify-end mb-6">
                <div className="flex p-1 bg-[var(--admin-bg-surface-variant)] rounded-xl w-fit">
                  <button onClick={() => setChartMode("volume")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartMode === 'volume' ? 'bg-[var(--admin-bg-card)] text-teal-600 shadow-sm' : 'text-[var(--admin-text-muted)]'}`}>Volume (₹)</button>
                  <button onClick={() => setChartMode("count")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartMode === 'count' ? 'bg-[var(--admin-bg-card)] text-teal-600 shadow-sm' : 'text-[var(--admin-text-muted)]'}`}>Count</button>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--admin-border)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--admin-text-muted)' }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[var(--admin-bg-card)] p-3 rounded-xl border border-[var(--admin-border-subtle)] shadow-xl">
                              <p className="text-xs font-bold text-[var(--admin-text-primary)] mb-1">{payload[0].payload.name}</p>
                              <p className="text-sm font-black text-teal-500">
                                {chartMode === 'volume' ? `₹${payload[0].value.toLocaleString()}` : `${payload[0].value} records`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey={chartMode === 'volume' ? 'volume' : 'count'} radius={[0, 4, 4, 0]}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00D4AA' : '#38BDF8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedTx && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[var(--admin-bg-card)] h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border-subtle)]">
                <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Transaction Detail</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-[var(--admin-bg-surface-variant)] rounded-xl transition-colors">
                  <X size={20} className="text-[var(--admin-text-muted)]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* User Info */}
                <div className="flex items-center gap-4 p-6 bg-[var(--admin-bg-surface-variant)] rounded-3xl border border-[var(--admin-border-subtle)]">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-lg shadow-teal-500/20">
                    {selectedTx.user.avatar ? <img src={selectedTx.user.avatar} className="w-full h-full object-cover" /> : (selectedTx.user.name?.charAt(0) || "?")}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">{selectedTx.user.name || "Anonymous"}</h3>
                    <p className="text-sm font-medium text-[var(--admin-text-secondary)]">{selectedTx.user.email}</p>
                    <button className="text-xs font-black text-teal-500 uppercase tracking-widest mt-2 hover:underline">View Profile</button>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">Transaction Data</p>
                    {selectedTx.isFlagged && <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full">Flagged Outlier</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <DetailBox label="Amount" value={`₹${selectedTx.amount.toLocaleString()}`} valueColor={activeTab === 'expenses' ? 'text-red-500' : 'text-emerald-500'} />
                    <DetailBox label="Date" value={new Date(selectedTx.date).toLocaleDateString()} />
                    <DetailBox label="Category" value={selectedTx.category || selectedTx.source || "N/A"} />
                    <DetailBox label="Subcategory" value={selectedTx.subcategory || "N/A"} />
                  </div>

                  <div className="p-6 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)]">
                    <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] mb-2">Note</p>
                    <p className="text-sm font-medium text-[var(--admin-text-secondary)] leading-relaxed italic">
                      "{selectedTx.note || "No notes provided for this transaction."}"
                    </p>
                  </div>

                  {/* Context Info */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">Administrative Context</p>
                    <div className="space-y-3">
                      <ContextItem label="Budget Utilization" value={txContext?.budgetPercentage ? `${txContext.budgetPercentage.toFixed(1)}% of monthly budget` : "N/A"} />
                      <ContextItem label="Category Average" value={txContext?.categoryAverage ? `₹${txContext.categoryAverage.toLocaleString()}` : "N/A"} />
                      <ContextItem label="User Monthly Total" value={`₹${txContext?.userMonthlyTotal?.toLocaleString() || "0"}`} />
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="space-y-4 pt-8 border-t border-[var(--admin-border-subtle)]">
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Danger Zone</p>
                  <textarea 
                    placeholder="Provide a reason for deletion..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full p-4 bg-[var(--admin-bg-surface-variant)] border border-[var(--admin-border-subtle)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-all"
                  />
                  <button 
                    onClick={handleDelete}
                    disabled={!deleteReason || actionLoading}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    {actionLoading ? "Deleting..." : "Permanently Delete Transaction"}
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

function StatChip({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="p-6 bg-[var(--admin-bg-card)] rounded-3xl border border-[var(--admin-border)] shadow-sm space-y-1">
      <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] tracking-widest">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function DetailBox({ label, value, valueColor }: { label: string, value: string, valueColor?: string }) {
  return (
    <div className="p-4 bg-[var(--admin-bg-surface-variant)] rounded-2xl border border-[var(--admin-border-subtle)]">
      <p className="text-[10px] font-black uppercase text-[var(--admin-text-muted)] mb-1">{label}</p>
      <p className={`text-sm font-bold ${valueColor || 'text-[var(--admin-text-primary)]'}`}>{value}</p>
    </div>
  );
}

function ContextItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-sm font-medium">
      <span className="text-[var(--admin-text-muted)]">{label}</span>
      <span className="text-[var(--admin-text-primary)] font-bold">{value}</span>
    </div>
  );
}
