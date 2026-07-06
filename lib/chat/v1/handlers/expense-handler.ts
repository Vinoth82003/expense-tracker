import { fetchExpenses } from "../api-gateway";
import { getCategoryBreakdown } from "../data-analyzer";
import { generateExpenseSummary } from "../response-generator";
import { ExtractedEntities } from "../entity-extractor";
import { GatewayParams } from "../api-gateway";

export async function handleExpenseSummary(entities: ExtractedEntities, params?: GatewayParams): Promise<string> {
  let timeframe = "this month";
  let monthParam: string | undefined;
  
  if (entities.dateStr === "last month") {
    timeframe = "last month";
    const today = new Date();
    today.setMonth(today.getMonth() - 1);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    monthParam = `${y}-${m}`;
  } else if (entities.dateStr === "today") {
    timeframe = "today";
  } else if (entities.dateStr === "yesterday") {
    timeframe = "yesterday";
  }

  // Build filters
  const options: { month?: string; category?: string; fromDate?: string; toDate?: string } = {};
  if (monthParam) {
    options.month = monthParam;
  } else if (entities.fromDate && entities.toDate) {
    options.fromDate = entities.fromDate.toISOString();
    options.toDate = entities.toDate.toISOString();
    timeframe = entities.dateStr || "selected period";
  } else {
    // default to current month
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    options.month = `${y}-${m}`;
  }

  if (entities.category) {
    options.category = entities.category;
  }

  const { expenses } = await fetchExpenses(options, params);

  // Compute total & breakdown
  const total = expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
  const breakdown = getCategoryBreakdown(expenses);

  let tip = "Track your daily expenses regularly to identify areas where you can save!";
  if (entities.category) {
    tip = `Keep an eye on your ${entities.category} spending to make sure it doesn't exceed your budget expectations.`;
  }

  return generateExpenseSummary(timeframe, total, breakdown, tip);
}
