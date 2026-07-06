import { fetchExpenses, fetchIncome, fetchBudget } from "../api-gateway";
import { formatCurrency, formatPercent } from "../response-generator";
import { getCategoryBreakdown } from "../data-analyzer";
import { ExtractedEntities } from "../entity-extractor";
import { GatewayParams } from "../api-gateway";

export async function handleInsights(
  intent: string,
  entities: ExtractedEntities,
  message: string,
  params?: GatewayParams
): Promise<string> {
  const normalized = message.toLowerCase();
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all data
  const { expenses } = await fetchExpenses(currentMonthStr, params);
  const { income } = await fetchIncome(currentMonthStr, params);
  
  let budgetLimit = 0;
  try {
    const budgetData = await fetchBudget(currentMonthStr, params);
    if (budgetData?.budget) {
      budgetLimit = budgetData.budget.limit;
    }
  } catch (e) {}

  const totalSpent = expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
  const totalEarned = income.reduce((sum: number, item: any) => sum + item.amount, 0);
  const netBalance = totalEarned - totalSpent;

  // 1. Where can I save / Savings advice
  if (normalized.includes("save") || normalized.includes("advice") || normalized.includes("habits")) {
    const breakdown = getCategoryBreakdown(expenses);
    if (breakdown.length === 0) {
      return "💡 No expenses recorded yet. Start logging your expenses to get personalized savings recommendations!";
    }
    const top = breakdown[0];
    return `💡 **Savings Insight**: Your highest spending category is **${top.category}** at **${formatCurrency(top.total)}** (${formatPercent(top.percentage)} of total). Reducing spending in this area by just 10% could save you **${formatCurrency(top.total * 0.1)}** this month!`;
  }

  // 2. Unusual expenses / Anomalies
  if (normalized.includes("unusual") || normalized.includes("anomaly") || normalized.includes("high")) {
    const highExpenses = expenses.filter((e: any) => e.amount > 1000);
    if (highExpenses.length === 0) {
      return "🔍 No unusually high individual expenses detected this month (all individual entries are under ₹1,000). Good job keeping them low!";
    }
    const listStr = highExpenses.map((e: any) => `• ${e.subcategory || "Other"} (${e.note || "No note"}): ${formatCurrency(e.amount)}`).join("\n");
    return `🔍 **Unusual / High Expenses Detected**:\n${listStr}\n\nReview these to ensure they were necessary!`;
  }

  // 3. Balance after expenses / Summary / Combined Query
  const percentUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  return `📊 **Financial Summary for This Month**:\n• Total Earned: **${formatCurrency(totalEarned)}**\n• Total Spent: **${formatCurrency(totalSpent)}**\n• Net Balance: **${formatCurrency(netBalance)}**\n• Budget Limit: **${formatCurrency(budgetLimit)}** (${formatPercent(percentUsed)} utilized)`;
}
