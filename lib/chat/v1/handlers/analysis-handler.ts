import { fetchExpenses } from "../api-gateway";
import { getDailyAverage, getWeekendSpending, getMonthOverMonth, getCategoryBreakdown } from "../data-analyzer";
import { generateTrend, formatCurrency } from "../response-generator";
import { ExtractedEntities } from "../entity-extractor";
import { GatewayParams } from "../api-gateway";

export async function handleAnalysis(
  intent: string,
  entities: ExtractedEntities,
  message: string,
  params?: GatewayParams
): Promise<string> {
  const normalized = message.toLowerCase();
  const today = new Date();
  
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

  const { expenses: currentExpenses } = await fetchExpenses(currentMonthStr, params);

  // 1. Daily Average Spending
  if (normalized.includes("average") || normalized.includes("daily")) {
    const avg = getDailyAverage(currentExpenses);
    return `📅 Your average daily spending for this month is **${formatCurrency(avg)}** per day.`;
  }

  // 2. Weekend Spending
  if (normalized.includes("weekend")) {
    const weekendSum = getWeekendSpending(currentExpenses);
    return `🏖️ You have spent a total of **${formatCurrency(weekendSum)}** over weekends this month.`;
  }

  // 3. Month over Month trend comparison
  const { expenses: prevExpenses } = await fetchExpenses(prevMonthStr, params);
  const mom = getMonthOverMonth(currentExpenses, prevExpenses);

  let insight = "";
  if (mom.change > 0) {
    insight = "💡 You've spent more than last month. Consider reviewing your top categories to see where you can trim back.";
  } else if (mom.change < 0) {
    insight = "💡 Great job! You are spending less compared to last month. Keep up the good work!";
  } else {
    insight = "💡 Your spending is exactly the same as last month. Consistent tracking!";
  }

  return generateTrend(
    mom.currentTotal,
    mom.previousTotal,
    mom.change,
    mom.percentChange,
    mom.direction,
    insight
  );
}
