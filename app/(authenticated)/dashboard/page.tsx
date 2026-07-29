"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Wallet,
  Banknote,
  Scale,
  Activity,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Shirt,
  Plane,
  GraduationCap,
  Film,
  Gift,
  Plus,
  AlertTriangle,
  PiggyBank,
  Target,
  PieChart as PieChartIcon,
  Settings2,
} from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#10b981"];
const CATEGORY_ICONS: Record<string, typeof Wallet> = {
  Food: Utensils,
  Rent: Home,
  Transport: Car,
  Utilities: Zap,
  Shopping: Shirt,
  Travel: Plane,
  Education: GraduationCap,
  Entertainment: Film,
  Gift: Gift,
  Other: ShoppingCart,
};

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] || ShoppingCart;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
  loading,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  color: string;
  delay: number;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 rounded-full ${color}/5`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${color}/10 text-${color.startsWith('text-') ? color.replace('text-', '') : color} flex items-center justify-center`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-xl font-bold text-foreground">
        {loading ? <span className="text-muted animate-pulse">...</span> : value}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const {
    expenses,
    incomes,
    prevExpenses,
    prevIncomes,
    monthlyLimit,
    expenseMode,
    loading,
    isTogglingMode,
    toggleExpenseMode,
  } = useDashboard();

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const stats = useMemo(() => {
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const netBalance = totalIncome - totalSpent;
    const remaining = monthlyLimit - totalSpent;

    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - currentDay + 1;
    const dailyAverage = totalSpent / (currentDay || 1);

    const todayStr = today.toISOString().split("T")[0];
    const todaySpend = expenses.filter((e) => e.date.startsWith(todayStr)).reduce((s, e) => s + e.amount, 0);
    const dailyLimit = expenseMode === "limit" ? Math.max(0, (monthlyLimit - (totalSpent - todaySpend)) / daysLeft) : 0;
    const todayUsagePercent = dailyLimit > 0 ? (todaySpend / dailyLimit) * 100 : 0;

    const needs = expenses.filter((e) => e.category === "Needs").reduce((s, e) => s + e.amount, 0);
    const wants = expenses.filter((e) => e.category === "Wants").reduce((s, e) => s + e.amount, 0);
    const savings = Math.max(0, totalIncome - totalSpent);
    const totalBase = totalIncome || totalSpent || 1;

    const prevTotalSpent = prevExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotalIncome = prevIncomes.reduce((s, i) => s + i.amount, 0);
    const spendChange = prevTotalSpent ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;
    const incomeChange = prevTotalIncome ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;

    const catMap = new Map<string, number>();
    expenses.forEach((e) => catMap.set(e.subcategory, (catMap.get(e.subcategory) || 0) + e.amount));
    const chartData = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const needsCatMap = new Map<string, number>();
    const wantsCatMap = new Map<string, number>();
    expenses.forEach((e) => {
      if (e.category === "Needs") needsCatMap.set(e.subcategory, (needsCatMap.get(e.subcategory) || 0) + e.amount);
      else wantsCatMap.set(e.subcategory, (wantsCatMap.get(e.subcategory) || 0) + e.amount);
    });

    return {
      totalSpent, totalIncome, netBalance, remaining,
      dailyAverage, dailyLimit, todaySpend, todayUsagePercent, daysLeft,
      needs, wants, savings,
      needsPct: (needs / totalBase) * 100,
      wantsPct: (wants / totalBase) * 100,
      savingsPct: (savings / totalBase) * 100,
      spendChange, incomeChange,
      chartData,
      needsChartData: Array.from(needsCatMap.entries()).map(([n, v]) => ({ name: n, value: v })),
      wantsChartData: Array.from(wantsCatMap.entries()).map(([n, v]) => ({ name: n, value: v })),
    };
  }, [expenses, incomes, prevExpenses, prevIncomes, expenseMode, monthlyLimit]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted mt-1">
            Here&apos;s your financial overview for{" "}
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleExpenseMode}
            disabled={isTogglingMode}
            className="flex items-center gap-2 text-xs font-semibold bg-surface border border-border-subtle px-3 py-2 rounded-xl hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            <Settings2 size={14} className={expenseMode === "limit" ? "text-primary-500" : "text-muted"} />
            {expenseMode === "limit" ? "Budget Mode" : "Free Mode"}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted bg-surface border border-border-subtle px-3 py-2 rounded-xl">
            <CalendarDays size={14} />
            {new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={Wallet} label="Total Spent" value={`\u20B9${stats.totalSpent.toLocaleString("en-IN")}`} color="bg-primary-500" delay={0.05} loading={loading} />
        <KpiCard icon={Banknote} label="Total Income" value={`\u20B9${stats.totalIncome.toLocaleString("en-IN")}`} color="bg-success" delay={0.1} loading={loading} />
        <KpiCard
          icon={Scale}
          label="Net Balance"
          value={`\u20B9${stats.netBalance.toLocaleString("en-IN")}`}
          color={stats.netBalance >= 0 ? "bg-success" : "bg-error"}
          delay={0.15}
          loading={loading}
        />
        {expenseMode === "limit" ? (
          <KpiCard
            icon={Target}
            label="Budget Left"
            value={`\u20B9${Math.max(0, stats.remaining).toLocaleString("en-IN")}`}
            color={stats.remaining >= 0 ? "bg-primary-500" : "bg-error"}
            delay={0.2}
            loading={loading}
          />
        ) : (
          <KpiCard icon={Activity} label="Daily Avg" value={`\u20B9${Math.round(stats.dailyAverage).toLocaleString("en-IN")}`} color="bg-tertiary-500" delay={0.2} loading={loading} />
        )}
      </div>

      {/* Daily Budget Bar */}
      {expenseMode === "limit" && monthlyLimit > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-subtle shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                stats.todayUsagePercent <= 50 ? "bg-success/10 text-success" :
                stats.todayUsagePercent <= 75 ? "bg-warning/10 text-warning" : "bg-error/10 text-error"
              }`}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Daily Budget</div>
                <div className="text-xs text-muted">
                  <span className="font-semibold text-foreground/80">{stats.dailyLimit > 0 ? `\u20B9${Math.round(stats.dailyLimit).toLocaleString("en-IN")}` : "\u20B90"}</span> left to spend today
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                stats.todayUsagePercent <= 50 ? "text-success" :
                stats.todayUsagePercent <= 75 ? "text-warning" : "text-error"
              }`}>
                {`\u20B9${stats.todaySpend.toLocaleString("en-IN")}`}
              </div>
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                {stats.todayUsagePercent.toFixed(0)}% used
              </div>
            </div>
          </div>
          <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.todayUsagePercent)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                stats.todayUsagePercent <= 50 ? "bg-success" :
                stats.todayUsagePercent <= 75 ? "bg-warning" : "bg-error"
              }`}
            />
          </div>
        </motion.div>
      )}

      {/* Recent Transactions + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-surface border border-border-subtle shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h2 className="text-sm font-bold text-foreground">Recent Transactions</h2>
            <Link
              href="/expenses"
              className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {loading ? (
              <div className="p-8 text-center text-xs text-muted animate-pulse">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart size={20} className="text-muted" />
                </div>
                <p className="text-sm text-muted mb-3">No expenses this month</p>
                <Link
                  href="/expenses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-lg hover:bg-primary-500/20 transition-colors"
                >
                  <Plus size={12} /> Add your first expense
                </Link>
              </div>
            ) : (
              <>
                {expenses.slice(0, 5).map((exp) => {
                  const Icon = getCategoryIcon(exp.subcategory);
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-variant/50 transition-colors border-b border-border-subtle last:border-0"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        exp.category === "Needs" ? "bg-primary-500/10 text-primary-500" : "bg-tertiary-500/10 text-tertiary-500"
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{exp.subcategory}</div>
                        <div className="text-[11px] text-muted">
                          {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {exp.note ? ` \u2022 ${exp.note}` : ""}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-foreground flex-shrink-0 whitespace-nowrap tabular-nums">
                        -{`\u20B9${exp.amount.toLocaleString("en-IN")}`}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-surface border border-border-subtle shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Spending by Category</h2>
            <Link href="/reports">
              <PieChartIcon size={16} className="text-muted hover:text-foreground transition-colors" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-xs text-muted animate-pulse">Loading...</div>
          ) : stats.chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center mb-2">
                <PieChartIcon size={18} className="text-muted" />
              </div>
              <p className="text-xs text-muted">No data to show yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {`\u20B9${stats.totalSpent.toLocaleString("en-IN")}`}
                </div>
                <div className="text-[11px] text-muted font-medium uppercase tracking-wider">Total Spent</div>
              </div>
              <div className="space-y-3.5">
                {stats.chartData.slice(0, 6).map((entry, idx) => {
                  const pct = (entry.value / stats.totalSpent) * 100;
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-xs font-semibold text-foreground truncate">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {`\u20B9${entry.value.toLocaleString("en-IN")}`}
                          </span>
                          <span className="text-[11px] font-bold text-muted w-10 text-right tabular-nums">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, pct)}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.06, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {stats.chartData.length > 6 && (
                <Link
                  href="/reports"
                  className="block text-center text-xs font-semibold text-primary-500 hover:text-primary-600 pt-1"
                >
                  View all {stats.chartData.length} categories
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Comparison + 50/30/20 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-surface border border-border-subtle shadow-sm p-5"
        >
          <h2 className="text-sm font-bold text-foreground mb-4">Month-over-Month</h2>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-xs text-muted animate-pulse">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-variant/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center">
                    <TrendingDown size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Spending</div>
                    <div className="text-sm font-bold text-foreground">
                      {`\u20B9${stats.totalSpent.toLocaleString("en-IN")}`}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-semibold flex items-center gap-1 ${stats.spendChange <= 0 ? "text-success" : "text-error"}`}>
                  {stats.spendChange <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  {Math.abs(stats.spendChange).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-variant/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Income</div>
                    <div className="text-sm font-bold text-foreground">
                      {`\u20B9${stats.totalIncome.toLocaleString("en-IN")}`}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-semibold flex items-center gap-1 ${stats.incomeChange >= 0 ? "text-success" : "text-error"}`}>
                  {stats.incomeChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(stats.incomeChange).toFixed(1)}%
                </div>
              </div>
              {expenseMode === "limit" && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-muted mb-2">
                    <span>Budget used</span>
                    <span className="font-semibold text-foreground">
                      {monthlyLimit > 0 ? `${Math.min(100, ((stats.totalSpent / monthlyLimit) * 100)).toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${monthlyLimit > 0 ? Math.min(100, (stats.totalSpent / monthlyLimit) * 100) : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        (stats.totalSpent / monthlyLimit) <= 0.5 ? "bg-success" :
                        (stats.totalSpent / monthlyLimit) <= 0.75 ? "bg-warning" : "bg-error"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* 50/30/20 Rule */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl bg-surface border border-border-subtle shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank size={16} className="text-primary-500" />
            <h2 className="text-sm font-bold text-foreground">50/30/20 Rule</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-xs text-muted animate-pulse">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    <span className="text-xs font-semibold text-foreground">Needs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${stats.needsPct <= 50 ? "text-success" : "text-error"}`}>
                      {stats.needsPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-muted">target 50%</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.needsPct)}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-full rounded-full ${stats.needsPct <= 50 ? "bg-primary-500" : "bg-error"}`}
                  />
                </div>
                <div className="text-xs font-semibold text-foreground/80 mt-1">
                  {`\u20B9${stats.needs.toLocaleString("en-IN")}`} spent
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-tertiary-500" />
                    <span className="text-xs font-semibold text-foreground">Wants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${stats.wantsPct <= 30 ? "text-success" : "text-error"}`}>
                      {stats.wantsPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-muted">target 30%</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.wantsPct)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full rounded-full ${stats.wantsPct <= 30 ? "bg-tertiary-500" : "bg-error"}`}
                  />
                </div>
                <div className="text-xs font-semibold text-foreground/80 mt-1">
                  {`\u20B9${stats.wants.toLocaleString("en-IN")}`} spent
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="text-xs font-semibold text-foreground">Savings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${stats.savingsPct >= 20 ? "text-success" : "text-warning"}`}>
                      {stats.savingsPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-muted">target 20%</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.savingsPct)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${stats.savingsPct >= 20 ? "bg-success" : "bg-warning"}`}
                  />
                </div>
                <div className="text-xs font-semibold text-foreground/80 mt-1">
                  {`\u20B9${stats.savings.toLocaleString("en-IN")}`} saved
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
