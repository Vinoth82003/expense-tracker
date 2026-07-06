export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  note: string | null;
  date: string | Date;
}

export interface IncomeItem {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  date: string | Date;
}

export function getCategoryBreakdown(expenses: ExpenseItem[]) {
  const breakdown: Record<string, number> = {};
  let total = 0;

  expenses.forEach((item) => {
    const cat = item.subcategory || "Other";
    breakdown[cat] = (breakdown[cat] || 0) + item.amount;
    total += item.amount;
  });

  return Object.entries(breakdown)
    .map(([category, sum]) => ({
      category,
      total: sum,
      percentage: total > 0 ? parseFloat(((sum / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getWeekendSpending(expenses: ExpenseItem[]): number {
  return expenses.reduce((sum, item) => {
    const day = new Date(item.date).getDay();
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return sum + item.amount;
    }
    return sum;
  }, 0);
}

export function getDailyAverage(expenses: ExpenseItem[]): number {
  if (expenses.length === 0) return 0;
  
  // Find distinct calendar days
  const distinctDays = new Set(
    expenses.map(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  
  const diffDays = distinctDays.size || 1;
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  return parseFloat((total / diffDays).toFixed(2));
}

export function getMonthOverMonth(currentExpenses: ExpenseItem[], previousExpenses: ExpenseItem[]) {
  const currentTotal = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const previousTotal = previousExpenses.reduce((sum, item) => sum + item.amount, 0);

  const change = currentTotal - previousTotal;
  const percentChange = previousTotal > 0 ? parseFloat(((change / previousTotal) * 100).toFixed(1)) : 0;

  return {
    currentTotal,
    previousTotal,
    change,
    percentChange,
    direction: (change > 0 ? "increased" : change < 0 ? "decreased" : "unchanged") as "increased" | "decreased" | "unchanged",
  };
}

export function getBudgetUtilization(expenses: ExpenseItem[], limit: number) {
  const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = limit - spent;
  const percentage = limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(1)) : 0;

  let status: "on_track" | "caution" | "danger" = "on_track";
  if (percentage >= 95) {
    status = "danger";
  } else if (percentage >= 75) {
    status = "caution";
  }

  return {
    spent,
    limit,
    remaining,
    percentage,
    status,
  };
}
