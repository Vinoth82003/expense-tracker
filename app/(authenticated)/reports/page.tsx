"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart as ChartIcon,
  TrendingUp,
  Target,
  Zap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  Flame,
  Trophy,
  BarChart2,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#84cc16"];
const CATEGORY_FILTERS = ["All", "Needs", "Wants"];

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-4 rounded-xl shadow-xl z-50">
        <p className="text-muted text-xs font-bold uppercase mb-1">{label}</p>
        <p className="font-black text-xl text-primary-500">₹{payload[0].value.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-3 rounded-xl shadow-xl z-50">
        <p className="text-muted text-xs font-bold mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
            <span className="font-bold text-sm text-secondary">{p.name}:</span>
            <span className="font-black text-sm">₹{p.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <span className="font-bold text-secondary">{payload[0].name}</span>
        <span className="font-black text-foreground ml-2">₹{payload[0].value.toLocaleString("en-IN")}</span>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"month" | "range">("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Needs" | "Wants">("All");
  const [selectedPieSlice, setSelectedPieSlice] = useState<string | null>(null);
  const [trendMode, setTrendMode] = useState<"daily" | "cumulative">("daily");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const monthlyLimit = (session?.user as any)?.monthlyLimit || 0;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let query = "";
      if (viewMode === "month") {
        query = `?month=${currentMonth}`;
      } else if (dateRange.from && dateRange.to) {
        query = `?fromDate=${dateRange.from}&toDate=${dateRange.to}`;
      } else {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/expenses${query}`);
      const data = await res.json();
      setRawExpenses(data.expenses || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    if (viewMode === "month" || (viewMode === "range" && dateRange.from && dateRange.to)) {
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, viewMode, currentMonth, dateRange]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedPieSlice(null);
  };

  const monthName = new Date(currentMonth + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let exps = rawExpenses;
    if (categoryFilter !== "All") exps = exps.filter(e => e.category === categoryFilter);
    if (selectedPieSlice) exps = exps.filter(e => e.subcategory === selectedPieSlice);
    return exps;
  }, [rawExpenses, categoryFilter, selectedPieSlice]);

  // ── KPI Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const needs = filteredExpenses.filter(e => e.category === "Needs").reduce((s, e) => s + e.amount, 0);
    const wants = filteredExpenses.filter(e => e.category === "Wants").reduce((s, e) => s + e.amount, 0);

    const dayMap = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const d = e.date.split("T")[0];
      dayMap.set(d, (dayMap.get(d) || 0) + e.amount);
    });

    const avgDaily = dayMap.size > 0 ? total / dayMap.size : 0;
    let heaviestDay = "";
    let heaviestAmount = 0;
    dayMap.forEach((amt, day) => {
      if (amt > heaviestAmount) { heaviestAmount = amt; heaviestDay = day; }
    });

    const subMap = new Map<string, number>();
    filteredExpenses.forEach(e => subMap.set(e.subcategory, (subMap.get(e.subcategory) || 0) + e.amount));
    let topCat = "";
    let topCatAmt = 0;
    subMap.forEach((amt, cat) => { if (amt > topCatAmt) { topCatAmt = amt; topCat = cat; } });

    return { total, needs, wants, avgDaily, heaviestDay, heaviestAmount, topCat, topCatAmt };
  }, [filteredExpenses]);

  const needsPercentage = stats.total > 0 ? (stats.needs / stats.total) * 100 : 0;

  // ── Chart data: Trend (daily or cumulative) ───────────────────────────────
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const d = e.date.split("T")[0];
      map.set(d, (map.get(d) || 0) + e.amount);
    });
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let running = 0;
    return sorted.map(([date, amount]) => {
      running += amount;
      return {
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount: trendMode === "cumulative" ? running : amount,
      };
    });
  }, [filteredExpenses, trendMode]);

  // ── Chart data: Weekly Bars ───────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const map = new Map<string, { Needs: number; Wants: number }>();
    filteredExpenses.forEach(e => {
      const day = new Date(e.date).getDate();
      const wk = `Wk ${Math.ceil(day / 7)}`;
      const cur = map.get(wk) || { Needs: 0, Wants: 0 };
      if (e.category === "Needs") cur.Needs += e.amount;
      else cur.Wants += e.amount;
      map.set(wk, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, data]) => ({ week, ...data }));
  }, [filteredExpenses]);

  // ── Chart data: Subcategory breakdown ─────────────────────────────────────
  const subcategoryData = useMemo(() => {
    const map = new Map<string, { value: number; category: string }>();
    filteredExpenses.forEach(e => {
      const cur = map.get(e.subcategory) || { value: 0, category: e.category };
      map.set(e.subcategory, { value: cur.value + e.amount, category: e.category });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, value: d.value, category: d.category }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const topSubcategories = subcategoryData.slice(0, 6);

  // ── All subcategories for filter popover ──────────────────────────────────
  const allSubcategories = useMemo(() => {
    const set = new Set<string>();
    rawExpenses.forEach(e => set.add(e.subcategory));
    return Array.from(set).sort();
  }, [rawExpenses]);

  const activeFiltersCount = (categoryFilter !== "All" ? 1 : 0) + (selectedPieSlice ? 1 : 0);

  // ── KPI card definitions ──────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Total Spent",
      value: `₹${stats.total.toLocaleString("en-IN")}`,
      icon: Wallet,
      color: "text-primary-500",
      bg: "bg-primary-500/10",
    },
    {
      label: "Daily Average",
      value: `₹${Math.round(stats.avgDaily).toLocaleString("en-IN")}`,
      icon: CalendarDays,
      color: "text-tertiary-500",
      bg: "bg-tertiary-500/10",
    },
    {
      label: "Heaviest Day",
      value: stats.heaviestDay
        ? new Date(stats.heaviestDay).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "—",
      sub: stats.heaviestDay ? `₹${stats.heaviestAmount.toLocaleString("en-IN")}` : "",
      icon: Flame,
      color: "text-error",
      bg: "bg-error/10",
    },
    {
      label: "Top Category",
      value: stats.topCat || "—",
      sub: stats.topCat ? `₹${stats.topCatAmt.toLocaleString("en-IN")}` : "",
      icon: Trophy,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">

      {/* ═══════════ FILTER BAR ═══════════ */}
      <section className="bg-surface border border-border-subtle rounded-[2.5rem] p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex p-1 bg-surface-variant rounded-xl gap-1">
            {(["month", "range"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setSelectedPieSlice(null); }}
                className={`px-5 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                  viewMode === mode
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                    : "text-secondary hover:text-foreground"
                }`}
              >
                {mode === "month" ? "By Month" : "Date Range"}
              </button>
            ))}
          </div>

          {/* Category Filter Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                activeFiltersCount > 0
                  ? "bg-primary-500/10 border-primary-500/30 text-primary-500"
                  : "bg-surface-variant border-transparent text-secondary hover:text-foreground"
              }`}
            >
              <Filter size={14} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showCategoryMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border-subtle rounded-2xl shadow-2xl z-20 p-5"
                  >
                    <h4 className="font-black text-xs uppercase tracking-widest text-muted mb-3">Category Type</h4>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {CATEGORY_FILTERS.map(f => (
                        <button
                          key={f}
                          onClick={() => setCategoryFilter(f as any)}
                          className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            categoryFilter === f
                              ? "bg-primary-500 text-white shadow-md"
                              : "bg-surface-variant text-secondary hover:text-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {allSubcategories.length > 0 && (
                      <>
                        <h4 className="font-black text-xs uppercase tracking-widest text-muted mb-3">Subcategory</h4>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                          {allSubcategories.map(sub => (
                            <button
                              key={sub}
                              onClick={() => setSelectedPieSlice(selectedPieSlice === sub ? null : sub)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                selectedPieSlice === sub
                                  ? "bg-tertiary-500 text-white"
                                  : "bg-surface-variant text-secondary hover:text-foreground"
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {activeFiltersCount > 0 && (
                      <button
                        onClick={() => {
                          setCategoryFilter("All");
                          setSelectedPieSlice(null);
                          setShowCategoryMenu(false);
                        }}
                        className="w-full mt-4 py-2.5 rounded-xl bg-error/10 text-error font-bold text-xs hover:bg-error/20 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Date Range Controls */}
        {viewMode === "month" ? (
          <div className="flex items-center justify-between bg-surface-variant/30 border border-border-subtle p-1.5 rounded-2xl">
            <button onClick={() => changeMonth(-1)} className="p-3 text-secondary hover:text-foreground transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-black tracking-tight text-lg">{monthName}</span>
            <button onClick={() => changeMonth(1)} className="p-3 text-secondary hover:text-foreground transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
              <input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full bg-surface-variant/30 border border-border-subtle rounded-2xl py-3.5 pl-11 pr-4 font-black text-xs focus:outline-none focus:border-primary-500 transition-all"
              />
            </div>
            <div className="w-4 h-0.5 bg-border-subtle shrink-0" />
            <div className="relative flex-1">
              <input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full bg-surface-variant/30 border border-border-subtle rounded-2xl py-3.5 px-4 font-black text-xs focus:outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {categoryFilter !== "All" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-500 rounded-full text-xs font-black border border-primary-500/20">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter("All")}><X size={12} /></button>
                </span>
              )}
              {selectedPieSlice && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary-500/10 text-tertiary-500 rounded-full text-xs font-black border border-tertiary-500/20">
                  {selectedPieSlice}
                  <button onClick={() => setSelectedPieSlice(null)}><X size={12} /></button>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ═══════════ KPI CARDS ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-surface border border-border-subtle rounded-[2rem] p-5 sm:p-6 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
              <card.icon size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{card.label}</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">{card.value}</p>
            {"sub" in card && card.sub && (
              <p className="text-xs text-secondary font-bold mt-0.5">{card.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted font-black text-xs uppercase tracking-widest">Crunching your data…</p>
        </div>
      ) : (
        <>
          {/* ═══════════ ROW 1: AREA/CUMULATIVE TREND ═══════════ */}
          <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-xl font-black flex items-center gap-3">
                <TrendingUp size={22} className="text-primary-500" />
                {trendMode === "daily" ? "Daily Spending Trend" : "Cumulative Budget Burn"}
              </h3>
              <div className="flex p-1 bg-surface-variant rounded-xl gap-1">
                {(["daily", "cumulative"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTrendMode(mode)}
                    className={`px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                      trendMode === mode
                        ? "bg-primary-500 text-white shadow-md"
                        : "text-secondary hover:text-foreground"
                    }`}
                  >
                    {mode === "daily" ? "Daily" : "Cumulative"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6366f110" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 600 }}
                      tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      dx={-8}
                    />
                    <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 2, strokeDasharray: "4 4" }} />
                    {trendMode === "cumulative" && monthlyLimit > 0 && (
                      <ReferenceLine
                        y={monthlyLimit}
                        stroke="#ef4444"
                        strokeDasharray="6 6"
                        strokeWidth={2}
                        label={{ value: "Budget", fill: "#ef4444", fontSize: 11, fontWeight: 700 }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTrend)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#6366f1" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted font-bold italic">
                  No spending data for this period.
                </div>
              )}
            </div>
          </div>

          {/* ═══════════ ROW 2: WEEKLY BARS + DONUT ═══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Weekly Grouped Bar Chart */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 sm:p-8 shadow-sm lg:col-span-2">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <BarChart2 size={22} className="text-tertiary-500" />
                Weekly Breakdown — Needs vs Wants
              </h3>
              <div className="h-64 w-full">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }} barGap={4} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6366f110" />
                      <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        dx={-8}
                      />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#6366f108" }} />
                      <Bar dataKey="Needs" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} name="Needs" />
                      <Bar dataKey="Wants" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={44} name="Wants" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted font-bold italic">
                    Not enough data for weekly view.
                  </div>
                )}
              </div>
              <div className="flex gap-6 mt-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary-500" />
                  <span className="text-xs font-bold text-secondary">Needs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#8b5cf6" }} />
                  <span className="text-xs font-bold text-secondary">Wants</span>
                </div>
              </div>
            </div>

            {/* Interactive Donut Chart */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 sm:p-8 shadow-sm flex flex-col">
              <h3 className="text-xl font-black mb-1 flex items-center gap-3">
                <ChartIcon size={22} className="text-tertiary-500" />
                Distribution
              </h3>
              <p className="text-muted text-xs font-bold uppercase tracking-widest mb-4">Tap a slice to filter</p>
              <div className="flex-1 flex flex-col items-center">
                {subcategoryData.length > 0 ? (
                  <>
                    <div className="h-52 w-full shrink-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <RePieChart>
                          <Pie
                            data={subcategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={78}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            onClick={entry => {
                              const name = entry?.name as string | undefined;
                              if (name) setSelectedPieSlice(selectedPieSlice === name ? null : name);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {subcategoryData.map((entry, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={COLORS[idx % COLORS.length]}
                                opacity={selectedPieSlice && selectedPieSlice !== entry.name ? 0.25 : 1}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1 mt-4">
                      {subcategoryData.map((entry, idx) => (
                        <button
                          key={entry.name}
                          onClick={() => setSelectedPieSlice(selectedPieSlice === entry.name ? null : entry.name)}
                          className={`w-full flex items-center justify-between text-sm rounded-xl px-2.5 py-1.5 transition-all ${
                            selectedPieSlice === entry.name
                              ? "bg-surface-variant ring-1 ring-primary-500/30"
                              : "hover:bg-surface-variant/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="font-bold text-secondary truncate text-xs">{entry.name}</span>
                          </div>
                          <span className="font-black shrink-0 ml-2 text-xs">₹{entry.value.toLocaleString("en-IN")}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted font-bold italic text-sm">
                    No data available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════ ROW 3: HORIZONTAL BARS + SMART INSIGHT ═══════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Horizontal Bar Chart — Top categories ranked */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <TrendingUp size={22} className="text-primary-500" />
                Top Spending
              </h3>
              <div className="h-64 w-full">
                {topSubcategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart
                      data={topSubcategories}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#6366f110" />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                        width={88}
                      />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#6366f108" }} />
                      <Bar dataKey="value" name="Spent" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {topSubcategories.map((_, idx) => (
                          <Cell key={`hcell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted font-bold italic">
                    No transactions to analyze.
                  </div>
                )}
              </div>
            </div>

            {/* Smart Insight Card */}
            <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                <Target size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-5">Smart Insight</h3>
                <div className="space-y-4">
                  {stats.total === 0 ? (
                    <p className="text-secondary font-bold leading-relaxed">
                      No spending data found for this period. Start tracking to see insights!
                    </p>
                  ) : (
                    <>
                      <p className="text-secondary font-bold leading-snug">
                        {needsPercentage > 70
                          ? "⚠️ Over 70% on essentials — check if fixed costs can be trimmed."
                          : needsPercentage > 50
                          ? "✅ More than half is essential spending — a healthy pattern."
                          : "🎯 Discretionary spending is dominant. Balance it with savings."}
                      </p>
                      {stats.topCat && (
                        <p className="text-secondary font-bold leading-snug">
                          🏆 <strong className="text-foreground">{stats.topCat}</strong> is your biggest expense at ₹{stats.topCatAmt.toLocaleString("en-IN")}.
                        </p>
                      )}
                      {monthlyLimit > 0 && (
                        <p className={`font-bold leading-snug ${stats.total / monthlyLimit > 0.85 ? "text-error" : "text-secondary"}`}>
                          {stats.total / monthlyLimit > 1
                            ? "🚨 You've exceeded your monthly budget!"
                            : stats.total / monthlyLimit > 0.8
                            ? `⚡ ${Math.round((stats.total / monthlyLimit) * 100)}% of budget used — pace yourself.`
                            : `💪 ${Math.round((stats.total / monthlyLimit) * 100)}% of budget used — you're on track!`}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-variant border border-border-subtle font-bold text-sm text-foreground">
                  <Zap size={16} className="text-warning" />
                  50/30/20 Rule
                </div>
                <p className="mt-3 text-muted text-sm font-medium">
                  Allocate 50% on needs, 30% wants, 20% savings every month.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
