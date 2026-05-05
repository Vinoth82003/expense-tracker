"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

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
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
  const [prevIncomes, setPrevIncomes] = useState<Income[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(0);
  const [expenseMode, setExpenseMode] = useState<string>("no-limit");
  const [loading, setLoading] = useState(true);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!session) return;
    
    try {
      const currentDate = new Date();
      const monthFilter = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const prevMonthFilter = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      
      const [expRes, incRes, budgetRes, prevExpRes, prevIncRes] = await Promise.all([
        fetch(`/api/expenses?month=${monthFilter}`),
        fetch(`/api/income?month=${monthFilter}`),
        fetch(`/api/budget?month=${monthFilter}`),
        fetch(`/api/expenses?month=${prevMonthFilter}`),
        fetch(`/api/income?month=${prevMonthFilter}`)
      ]);

      const [expData, incData, budgetData, prevExpData, prevIncData] = await Promise.all([
        expRes.json(),
        incRes.json(),
        budgetRes.json(),
        prevExpRes.json(),
        prevIncRes.json()
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
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
      
      const handleRefresh = () => fetchDashboardData();
      window.addEventListener('expenseAdded', handleRefresh);
      window.addEventListener('incomeAdded', handleRefresh);
      return () => {
        window.removeEventListener('expenseAdded', handleRefresh);
        window.removeEventListener('incomeAdded', handleRefresh);
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
      toggleExpenseMode
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
