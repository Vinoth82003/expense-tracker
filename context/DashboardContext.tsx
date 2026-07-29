"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useData, cacheKey } from "./DataContext";

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
  note: string | null;
}

interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  note: string | null;
}

interface DashboardContextType {
  expenses: Expense[];
  incomes: Income[];
  prevExpenses: Expense[];
  prevIncomes: Income[];
  monthlyLimit: number;
  expenseMode: string;
  loading: boolean;
  isTogglingMode: boolean;
  refreshData: () => Promise<void>;
  toggleExpenseMode: () => Promise<void>;
  stats: {
    totalSpent: number;
    totalIncome: number;
    netBalance: number;
    dailyAverage: number;
    remaining: number;
  };
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { fetchCached } = useData();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
  const [prevIncomes, setPrevIncomes] = useState<Income[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(0);
  const [expenseMode, setExpenseMode] = useState<string>("no-limit");
  const [loading, setLoading] = useState(true);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  const stats = React.useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netBalance = totalIncome - totalSpent;
    const remaining = monthlyLimit - totalSpent;
    
    const today = new Date();
    const currentDay = today.getDate();
    const dailyAverage = totalSpent / (currentDay || 1);

    return { totalSpent, totalIncome, netBalance, dailyAverage, remaining };
  }, [expenses, incomes, monthlyLimit]);

  const fetchDashboardData = useCallback(async () => {
    if (!session) return;
    
    try {
      const currentDate = new Date();
      const monthFilter = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const prevMonthFilter = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const handleRes = async (res: Response) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      };

      const [expData, incData, budgetData, prevExpData, prevIncData] = await Promise.all([
        fetchCached<{ expenses: Expense[] }>(
          cacheKey("expenses", monthFilter),
          () => fetch(`/api/expenses?month=${monthFilter}`).then(handleRes)
        ),
        fetchCached<{ incomes: Income[] }>(
          cacheKey("income", monthFilter),
          () => fetch(`/api/income?month=${monthFilter}`).then(handleRes)
        ),
        fetch(`/api/budget?month=${monthFilter}`).then(handleRes),
        fetchCached<{ expenses: Expense[] }>(
          cacheKey("expenses", prevMonthFilter),
          () => fetch(`/api/expenses?month=${prevMonthFilter}`).then(handleRes)
        ),
        fetchCached<{ incomes: Income[] }>(
          cacheKey("income", prevMonthFilter),
          () => fetch(`/api/income?month=${prevMonthFilter}`).then(handleRes)
        ),
      ]);

      setExpenses(expData.expenses || []);
      setIncomes(incData.incomes || []);
      setPrevExpenses(prevExpData.expenses || []);
      setPrevIncomes(prevIncData.incomes || []);
      setMonthlyLimit(budgetData.limit || 0);
      
      if (session.user) {
        setExpenseMode((session.user as any).expenseMode || "no-limit");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [session, fetchCached]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
      
      const handleExpenseAdded = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) {
          setExpenses((prev) => {
            if (prev.some((x) => x.id === detail.id)) return prev;
            return [detail, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        } else {
          fetchDashboardData();
        }
      };

      const handleIncomeAdded = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) {
          setIncomes((prev) => {
            if (prev.some((x) => x.id === detail.id)) return prev;
            return [detail, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        } else {
          fetchDashboardData();
        }
      };

      const handleBudgetUpdated = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) {
          if (typeof detail.limit === "number") {
            setMonthlyLimit(detail.limit);
          }
          if (detail.expenseMode) {
            setExpenseMode(detail.expenseMode);
          }
        } else {
          fetchDashboardData();
        }
      };

      window.addEventListener("expenseAdded", handleExpenseAdded);
      window.addEventListener("incomeAdded", handleIncomeAdded);
      window.addEventListener("budgetUpdated", handleBudgetUpdated);
      return () => {
        window.removeEventListener("expenseAdded", handleExpenseAdded);
        window.removeEventListener("incomeAdded", handleIncomeAdded);
        window.removeEventListener("budgetUpdated", handleBudgetUpdated);
      };
    }
  }, [session, fetchDashboardData]);

  const toggleExpenseMode = async () => {
    if (isTogglingMode) return;
    setIsTogglingMode(true);
    const newMode = expenseMode === "limit" ? "no-limit" : "limit";
    try {
      const res = await fetch("/api/user/expense-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseMode: newMode })
      });
      if (res.ok) {
        setExpenseMode(newMode);
        if (session && session.user) {
          (session.user as any).expenseMode = newMode;
        }
      }
    } catch (error) {
      console.error("Failed to toggle expense mode:", error);
    } finally {
      setIsTogglingMode(false);
    }
  };

  return (
    <DashboardContext.Provider value={{ 
      expenses, 
      incomes, 
      prevExpenses,
      prevIncomes,
      monthlyLimit, 
      expenseMode, 
      loading, 
      isTogglingMode,
      refreshData: fetchDashboardData,
      toggleExpenseMode,
      stats
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
