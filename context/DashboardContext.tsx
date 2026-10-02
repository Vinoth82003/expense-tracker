"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useUser, type Expense, type Income } from "./UserContext";

export type { Expense, Income };

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

/**
 * Compatibility shim. Transaction state now lives in UserContext; this provider
 * only projects it under the historical `useDashboard()` contract so existing
 * pages keep working unchanged. New code should use `useUser()`.
 */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const user = useUser();

  const value: DashboardContextType = {
    expenses: user.expenses,
    incomes: user.incomes,
    prevExpenses: user.prevExpenses,
    prevIncomes: user.prevIncomes,
    monthlyLimit: user.monthlyLimit,
    expenseMode: user.expenseMode,
    loading: user.loading,
    isTogglingMode: user.isTogglingMode,
    refreshData: user.refreshData,
    toggleExpenseMode: user.toggleExpenseMode,
    stats: user.stats,
  };

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}