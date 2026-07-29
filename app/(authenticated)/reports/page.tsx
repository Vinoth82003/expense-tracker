"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo, useRef } from "react";
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
  Eye,
  Triangle
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
}

interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
}

const COLORS = ["#6366f1", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#f43f5e", "#84cc16", "#a855f7"];
const CATEGORY_FILTERS = ["All", "Needs", "Wants"];

interface ChartPayload {
  name: string;
  value: number;
  color?: string;
  stroke?: string;
  fill?: string;
  payload: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartPayload[];
  label?: string;
}

const CustomAreaTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-4 rounded-xl shadow-xl z-50">
        <p className="text-muted text-xs font-bold uppercase mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.color }} />
             <span className="font-bold text-sm text-secondary truncate max-w-[120px]">{p.name}:</span>
             <span className="font-black text-sm">₹{p.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle p-3 rounded-xl shadow-xl z-50">
        <p className="text-muted text-xs font-bold mb-2">{label}</p>
        {payload.map((p, i) => (
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

const CustomPieTooltip = ({ active, payload }: CustomTooltipProps) => {
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
  const { 
    expenses: contextExpenses, 
    incomes: contextIncomes, 
    prevExpenses: contextPrevExpenses,
    monthlyLimit: contextMonthlyLimit,
    loading: contextLoading,
    refreshData: refreshContext
  } = useDashboard();

  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  const [rawIncomes, setRawIncomes] = useState<Income[]>([]);
  const [prevRawExpenses, setPrevRawExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "range" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "all">("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [currentDay, setCurrentDay] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const start = new Date(d.setDate(diff));
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Needs" | "Wants">("All");
  const [selectedPieSlice, setSelectedPieSlice] = useState<string | null>(null);
  const [trendMode, setTrendMode] = useState<"daily" | "cumulative" | "stacked" | "cashflow">("daily");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const trendRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modes = ["day", "week", "month", "3M", "6M", "1Y", "3Y", "5Y", "all", "range"] as const;
  const trendModes = ["daily", "cumulative", "stacked", "cashflow"] as const;

  const monthlyLimit = contextMonthlyLimit;

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let query = "";
      let prevQuery = "";

      if (viewMode === "month") {
        query = `?month=${currentMonth}`;
        const [year, month] = currentMonth.split("-").map(Number);
        const prevMonthDate = new Date(year, month - 2, 1);
        prevQuery = `?month=${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (viewMode === "day") {
        query = `?fromDate=${currentDay}&toDate=${currentDay}`;
        const d = new Date(currentDay);
        d.setDate(d.getDate() - 1);
        const prevDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        prevQuery = `?fromDate=${prevDay}&toDate=${prevDay}`;
      } else if (viewMode === "week") {
        const start = new Date(currentWeekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
        query = `?fromDate=${currentWeekStart}&toDate=${endStr}`;

        const prevStart = new Date(currentWeekStart);
        prevStart.setDate(prevStart.getDate() - 7);
        const prevEnd = new Date(prevStart);
        prevEnd.setDate(prevEnd.getDate() + 6);
        const prevStartStr = `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, "0")}-${String(prevStart.getDate()).padStart(2, "0")}`;
        const prevEndStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2, "0")}-${String(prevEnd.getDate()).padStart(2, "0")}`;
        prevQuery = `?fromDate=${prevStartStr}&toDate=${prevEndStr}`;
      } else if (viewMode === "range" && dateRange.from && dateRange.to) {
        query = `?fromDate=${dateRange.from}&toDate=${dateRange.to}`;
        const start = new Date(dateRange.from);
        const end = new Date(dateRange.to);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - diffDays);
        
        const prevStartStr = `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, "0")}-${String(prevStart.getDate()).padStart(2, "0")}`;
        const prevEndStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2, "0")}-${String(prevEnd.getDate()).padStart(2, "0")}`;
        prevQuery = `?fromDate=${prevStartStr}&toDate=${prevEndStr}`;
      } else if (["3M", "6M", "1Y", "3Y", "5Y"].includes(viewMode)) {
        const months = viewMode === "3M" ? 3 : viewMode === "6M" ? 6 : viewMode === "1Y" ? 12 : viewMode === "3Y" ? 36 : 60;
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - months);
        
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
        query = `?fromDate=${startStr}&toDate=${endStr}`;

        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setMonth(prevStart.getMonth() - months);
        const prevStartStr = `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, "0")}-${String(prevStart.getDate()).padStart(2, "0")}`;
        const prevEndStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2, "0")}-${String(prevEnd.getDate()).padStart(2, "0")}`;
        prevQuery = `?fromDate=${prevStartStr}&toDate=${prevEndStr}`;
      } else if (viewMode === "all") {
        query = "";
        prevQuery = ""; // No comparison for all time
      } else {
        setLoading(false);
        return;
      }
      const [expRes, incRes, prevExpRes] = await Promise.all([
        fetch(`/api/expenses${query}`),
        fetch(`/api/income${query}`),
        fetch(`/api/expenses${prevQuery}`)
      ]);
      const expData = await expRes.json();
      const incData = await incRes.json();
      const prevExpData = await prevExpRes.json();
      
      setRawExpenses(expData.expenses || []);
      setRawIncomes(incData.incomes || []);
      setPrevRawExpenses(prevExpData.expenses || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ACTUAL_CURRENT_MONTH = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    if (viewMode === "month" && currentMonth === ACTUAL_CURRENT_MONTH) {
      setRawExpenses(contextExpenses);
      setRawIncomes(contextIncomes);
      setPrevRawExpenses(contextPrevExpenses);
      setLoading(contextLoading);
    } else {
      fetchExpenses();
    }

    const handleRefresh = () => {
      if (viewMode === "month" && currentMonth === ACTUAL_CURRENT_MONTH) {
        refreshContext();
      } else {
        fetchExpenses();
      }
    };

    window.addEventListener('expenseAdded', handleRefresh);
    window.addEventListener('incomeAdded', handleRefresh);
    
    return () => {
      window.removeEventListener('expenseAdded', handleRefresh);
      window.removeEventListener('incomeAdded', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentMonth, currentDay, currentWeekStart, dateRange, contextExpenses, contextIncomes, contextPrevExpenses, contextLoading]);

  // Auto-scroll for mode tabs
  useEffect(() => {
    const activeIndex = modes.indexOf(viewMode);
    if (modeRefs.current[activeIndex]) {
      modeRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
    // Also reset page scroll on view mode change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  // Auto-scroll for trend tabs
  useEffect(() => {
    const activeIndex = trendModes.indexOf(trendMode as any);
    if (trendRefs.current[activeIndex]) {
      trendRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [trendMode]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedPieSlice(null);
  };

  const changeDay = (offset: number) => {
    const d = new Date(currentDay);
    d.setDate(d.getDate() + offset);
    setCurrentDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    setSelectedPieSlice(null);
  };

  const changeWeek = (offset: number) => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() + (offset * 7));
    setCurrentWeekStart(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`);
    setSelectedPieSlice(null);
  };

  const monthName = new Date(currentMonth + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  
  const dayName = new Date(currentDay).toLocaleDateString("en-IN", {
    weekday: "long", month: "short", day: "numeric", year: "numeric"
  });

  const getWeekName = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const getRangeName = () => {
    if (viewMode === "3M") return "Last 3 Months";
    if (viewMode === "6M") return "Last 6 Months";
    if (viewMode === "1Y") return "Last Year";
    if (viewMode === "3Y") return "Last 3 Years";
    if (viewMode === "5Y") return "Last 5 Years";
    if (viewMode === "all") return "All Time History";
    return "Custom Date Range";
  };

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let exps = rawExpenses;
    if (categoryFilter !== "All") exps = exps.filter(e => e.category === categoryFilter);
    if (selectedPieSlice) exps = exps.filter(e => e.subcategory === selectedPieSlice);
    return exps;
  }, [rawExpenses, categoryFilter, selectedPieSlice]);

  const filteredPrevExpenses = useMemo(() => {
    let exps = prevRawExpenses;
    if (categoryFilter !== "All") exps = exps.filter(e => e.category === categoryFilter);
    if (selectedPieSlice) exps = exps.filter(e => e.subcategory === selectedPieSlice);
    return exps;
  }, [prevRawExpenses, categoryFilter, selectedPieSlice]);

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

    const totalIncome = rawIncomes.reduce((s, inc) => s + inc.amount, 0);
    const savings = totalIncome - total;

    const subMap = new Map<string, number>();
    filteredExpenses.forEach(e => subMap.set(e.subcategory, (subMap.get(e.subcategory) || 0) + e.amount));
    let topCat = "";
    let topCatAmt = 0;
    subMap.forEach((amt, cat) => { if (amt > topCatAmt) { topCatAmt = amt; topCat = cat; } });

    return { total, totalIncome, savings, needs, wants, avgDaily, heaviestDay, heaviestAmount, topCat, topCatAmt };
  }, [filteredExpenses, rawIncomes]);

  const needsPercentage = stats.totalIncome > 0 ? (stats.needs / stats.totalIncome) * 100 : (stats.total > 0 ? (stats.needs / stats.total) * 100 : 0);
  const wantsPercentage = stats.totalIncome > 0 ? (stats.wants / stats.totalIncome) * 100 : (stats.total > 0 ? (stats.wants / stats.total) * 100 : 0);
  const savingsPercentage = stats.totalIncome > 0 ? (stats.savings / stats.totalIncome) * 100 : 0;

  // ── Radar Data (50/30/20 Comparison) ──────────────────────────────────────
  const radarData = [
    { subject: `Needs (50%)`, A: Number(needsPercentage.toFixed(1)), B: 50 },
    { subject: `Wants (30%)`, A: Number(wantsPercentage.toFixed(1)), B: 30 },
    { subject: `Savings (20%)`, A: Number(Math.max(0, savingsPercentage).toFixed(1)), B: 20 },
  ];

  // ── Trend Data (Daily, Cumulative, or Stacked) ─────────────────────────────
  const trendData = useMemo(() => {
    const map = new Map<string, { total: number; Needs: number; Wants: number; Income: number }>();
    
    // Process Expenses
    filteredExpenses.forEach(e => {
      const d = e.date.split("T")[0];
      const cur = map.get(d) || { total: 0, Needs: 0, Wants: 0, Income: 0 };
      cur.total += e.amount;
      if (e.category === "Needs") cur.Needs += e.amount;
      else cur.Wants += e.amount;
      map.set(d, cur);
    });

    // Process Incomes
    rawIncomes.forEach(inc => {
      const d = inc.date.split("T")[0];
      const cur = map.get(d) || { total: 0, Needs: 0, Wants: 0, Income: 0 };
      cur.Income += inc.amount;
      map.set(d, cur);
    });

    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let running = 0;
    return sorted.map(([date, d]) => {
      running += d.total;
      return {
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount: trendMode === "cumulative" ? running : d.total,
        Needs: d.Needs,
        Wants: d.Wants,
        Income: d.Income
      };
    });
  }, [filteredExpenses, rawIncomes, trendMode]);

  // ── Chart data: Weekly Bars ───────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const map = new Map<string, { Needs: number; Wants: number }>();
    filteredExpenses.forEach(e => {
      const date = new Date(e.date);
      const day = date.getDate();
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

  // ── Chart data: Comparison Data ───────────────────────────────────────────
  const comparisonData = useMemo(() => {
    const curTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = filteredPrevExpenses.reduce((s, e) => s + e.amount, 0);
    
    return [
      { name: "Previous", amount: prevTotal, fill: "#cbd5e1" },
      { name: "Current", amount: curTotal, fill: "#6366f1" }
    ];
  }, [filteredExpenses, filteredPrevExpenses]);

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
      label: "Actual Savings",
      value: `₹${Math.max(0, stats.savings).toLocaleString("en-IN")}`,
      sub: stats.totalIncome > 0 ? `${((stats.savings / stats.totalIncome) * 100).toFixed(1)}% of income` : "No income recorded",
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ═══ FILTER BAR ═══ */}
      <section className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-surface-variant rounded-lg p-0.5 overflow-x-auto no-scrollbar">
            {modes.map((mode, index) => (
              <button
                key={mode}
                ref={el => { modeRefs.current[index] = el; }}
                onClick={() => { setViewMode(mode); setSelectedPieSlice(null); }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  viewMode === mode
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-secondary hover:text-foreground"
                }`}
              >
                {mode === "range" ? "Range" : 
                 mode === "all" ? "All" :
                 ["3M", "6M", "1Y", "3Y", "5Y"].includes(mode) ? mode :
                 mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  activeFiltersCount > 0
                    ? "bg-primary-500/10 border-primary-500/30 text-primary-500"
                    : "bg-surface-variant border-border-subtle text-secondary hover:text-foreground"
                }`}
              >
                <Filter size={13} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="bg-primary-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showCategoryMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-full mt-1.5 w-64 bg-surface border border-border-subtle rounded-xl shadow-lg z-20 p-4"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Category</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {CATEGORY_FILTERS.map(f => (
                          <button
                            key={f}
                            onClick={() => setCategoryFilter(f as any)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              categoryFilter === f
                                ? "bg-primary-500 text-white"
                                : "bg-surface-variant text-secondary hover:text-foreground"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {allSubcategories.length > 0 && (
                        <>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Subcategory</p>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                            {allSubcategories.map(sub => (
                              <button
                                key={sub}
                                onClick={() => setSelectedPieSlice(selectedPieSlice === sub ? null : sub)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                  selectedPieSlice === sub
                                    ? "bg-primary-500 text-white"
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
                          onClick={() => { setCategoryFilter("All"); setSelectedPieSlice(null); setShowCategoryMenu(false); }}
                          className="w-full mt-3 py-1.5 rounded-md bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Date nav */}
            <div className="flex items-center gap-1 bg-surface-variant rounded-lg px-3 py-1.5">
              <button onClick={() => viewMode === "month" ? changeMonth(-1) : viewMode === "day" ? changeDay(-1) : changeWeek(-1)} className="p-0.5 text-secondary hover:text-foreground">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-foreground px-2 whitespace-nowrap">
                {viewMode === "month" ? monthName : viewMode === "day" ? dayName : viewMode === "week" ? getWeekName() : getRangeName()}
              </span>
              <button onClick={() => viewMode === "month" ? changeMonth(1) : viewMode === "day" ? changeDay(1) : changeWeek(1)} className="p-0.5 text-secondary hover:text-foreground">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categoryFilter !== "All" && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded text-[10px] font-medium">
                {categoryFilter}
                <button onClick={() => setCategoryFilter("All")}><X size={11} /></button>
              </span>
            )}
            {selectedPieSlice && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded text-[10px] font-medium">
                {selectedPieSlice}
                <button onClick={() => setSelectedPieSlice(null)}><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-surface border border-border-subtle rounded-xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center mb-2.5`}>
              <card.icon size={16} />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-0.5 truncate">{card.label}</p>
            <p className="text-lg font-bold tracking-tight truncate">{card.value}</p>
            {"sub" in card && card.sub && (
              <p className="text-[11px] text-secondary mt-0.5 truncate">{card.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted font-medium">Crunching your data...</p>
        </div>
      ) : (
        <>
          {/* ═══ TREND + 50/30/20 ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Spend Trend */}
            <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-xl p-5">
                <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-sm font-semibold text-foreground shrink-0">Spend Trend</h3>
                <div className="flex gap-1 bg-surface-variant rounded-md p-0.5 overflow-x-auto no-scrollbar">
                  {(["daily", "cumulative", "cashflow"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setTrendMode(mode)}
                      className={`px-3 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                        trendMode === mode
                          ? "bg-primary-500 text-white"
                          : "text-secondary hover:text-foreground"
                      }`}
                    >
                      {mode === "daily" ? "Daily" : mode === "cumulative" ? "Cumulative" : "Cashflow"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} dx={-4} />
                    <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "3 3" }} />
                    {trendMode === "cashflow" ? (
                      <>
                        <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 4, fill: "#10b981" }} name="Income" />
                        <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" activeDot={{ r: 4, fill: "#6366f1" }} name="Expenses" />
                      </>
                    ) : (
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" activeDot={{ r: 4, fill: "#6366f1" }} name="Amount" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 50/30/20 */}
            <div className="bg-surface border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">50/30/20 Rule</h3>
              <p className="text-[10px] text-muted mb-4">How your spending compares to the ideal budget</p>
              <div className="space-y-4">
                {[
                  { label: "Needs", pct: needsPercentage, target: 50, color: "bg-primary-500", textColor: "text-primary-500" },
                  { label: "Wants", pct: wantsPercentage, target: 30, color: "bg-tertiary-500", textColor: "text-tertiary-500" },
                  { label: "Savings", pct: Math.max(0, savingsPercentage), target: 20, color: "bg-success", textColor: "text-success" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      <span className="text-xs font-semibold tabular-nums">
                        <span className={item.pct > item.target ? "text-error" : item.textColor}>{item.pct.toFixed(1)}%</span>
                        <span className="text-muted font-normal"> / {item.target}%</span>
                      </span>
                    </div>
                    <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, item.pct)}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className={`h-full rounded-full ${item.pct > item.target ? "bg-error" : item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ CATEGORY BARS + COMPARISON ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Spending Categories */}
            <div className="bg-surface border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Top Spending Categories</h3>
              <p className="text-[10px] text-muted mb-4">Where your money goes — highest to lowest</p>
              {topSubcategories.length > 0 ? (
                <div className="space-y-3">
                  {topSubcategories.map((entry, idx) => {
                    const pct = (entry.value / stats.total) * 100;
                    return (
                      <div key={entry.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-xs font-medium text-foreground truncate">{entry.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground tabular-nums ml-2 shrink-0">
                            ₹{entry.value.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-xs text-muted">No data.</div>
              )}
            </div>

            {/* Period Comparison */}
            <div className="bg-surface border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Period Comparison</h3>
              <p className="text-[10px] text-muted mb-4">Current vs previous period</p>
              <div className="h-52 w-full relative">
                {mounted && isReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={6} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} dx={-4} />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#6366f108" }} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50} name="Total Spent">
                        {comparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill === "#cbd5e1" ? "#94a3b8" : "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} dx={-4} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {(!mounted || !isReady) && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">Not enough data.</div>
                )}
              </div>
              {comparisonData.length === 2 && comparisonData[1].amount > 0 && (
                <div className="mt-3 text-xs text-center">
                  {(() => {
                    const change = comparisonData[0].amount > 0
                      ? ((comparisonData[1].amount - comparisonData[0].amount) / comparisonData[0].amount) * 100
                      : 0;
                    return (
                      <span className={change <= 0 ? "text-success" : "text-error"}>
                        {change <= 0 ? "Down" : "Up"} {Math.abs(change).toFixed(1)}% vs previous period
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* ═══ ACTIONABLE INSIGHTS ═══ */}
          <section className="bg-surface border border-border-subtle rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Actionable Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Health Score */}
              <div className="bg-surface-variant/50 rounded-lg p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={15} className="text-primary-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Financial Health</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{Math.max(0, Math.round(100 - Math.abs(50 - needsPercentage) - Math.abs(30 - wantsPercentage)))}%</p>
                <p className="text-[11px] text-secondary mt-1">
                  {needsPercentage > 70
                    ? "Needs are too high — review fixed costs"
                    : wantsPercentage > 30
                    ? "Wants are above target — trim discretionary"
                    : "You're on track with the 50/30/20 rule"}
                </p>
              </div>

              {/* Biggest Saver Opportunity */}
              <div className="bg-surface-variant/50 rounded-lg p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={15} className="text-primary-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Biggest Opportunity</span>
                </div>
                {stats.topCat ? (
                  <>
                    <p className="text-sm font-semibold text-foreground truncate mb-1">{stats.topCat}</p>
                    <p className="text-[11px] text-secondary">
                      Cutting <span className="font-semibold text-foreground">10%</span> saves you <span className="font-semibold text-success">₹{(stats.topCatAmt * 0.1).toLocaleString("en-IN")}</span> next month
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-secondary">Add expenses to see opportunities</p>
                )}
              </div>

              {/* Daily Budget */}
              <div className="bg-surface-variant/50 rounded-lg p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={15} className="text-primary-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Daily Average</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">₹{Math.round(stats.avgDaily).toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-secondary mt-1">
                  {monthlyLimit > 0
                    ? `Target: ₹${Math.round(monthlyLimit / 30).toLocaleString("en-IN")}/day`
                    : `${stats.total > 0 ? `${filteredExpenses.length} transactions` : "No spending yet"}`}
                </p>
              </div>
            </div>

            {/* Needs vs Wants Breakdown */}
            <div className="mt-4 bg-surface-variant/30 rounded-lg p-4 border border-border-subtle">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={15} className="text-primary-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Needs vs Wants</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">Needs <span className="text-muted font-normal">(target 50%)</span></span>
                    <span className={`font-semibold ${needsPercentage > 50 ? "text-error" : "text-success"}`}>{needsPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, needsPercentage)}%` }}
                      className={`h-full rounded-full ${needsPercentage > 50 ? "bg-error" : "bg-primary-500"}`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">Wants <span className="text-muted font-normal">(target 30%)</span></span>
                    <span className={`font-semibold ${wantsPercentage > 30 ? "text-error" : "text-success"}`}>{wantsPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, wantsPercentage)}%` }}
                      className={`h-full rounded-full ${wantsPercentage > 30 ? "bg-error" : "bg-tertiary-500"}`}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-secondary mt-3">
                {needsPercentage > 70
                  ? "Your essentials are high. Review rent, EMIs, and subscriptions to free up cash."
                  : needsPercentage > 50
                  ? "Needs are slightly above target. Small cuts in utilities or subscriptions can help."
                  : wantsPercentage > 30
                  ? "Wants are above target. Consider trimming dining, shopping, or entertainment."
                  : "Your needs/wants balance is healthy. Great job maintaining discipline!"}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
