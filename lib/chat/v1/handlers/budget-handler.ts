import { fetchBudget, fetchExpenses } from "../api-gateway";
import { getBudgetUtilization } from "../data-analyzer";
import { generateBudgetStatus } from "../response-generator";
import { ExtractedEntities } from "../entity-extractor";
import { GatewayParams } from "../api-gateway";

export async function handleBudgetStatus(entities: ExtractedEntities, params?: GatewayParams): Promise<string> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${y}-${m}`;

  // Fetch budget for the month
  let budgetLimit = 0;
  try {
    const budgetData = await fetchBudget(currentMonth, params);
    if (budgetData && typeof budgetData.limit === "number") {
      budgetLimit = budgetData.limit;
    }
  } catch (error) {
    // If no budget is set, it might return error or limit=0
    budgetLimit = 0;
  }

  // Fetch expenses for the month
  const { expenses } = await fetchExpenses(currentMonth, params);

  const utilization = getBudgetUtilization(expenses, budgetLimit);

  let emoji = "✅";
  let statusText = "On Track";

  if (utilization.status === "danger") {
    emoji = "🚨";
    statusText = "Over Budget / Danger";
  } else if (utilization.status === "caution") {
    emoji = "⚠️";
    statusText = "Warning (exceeded 75%)";
  }

  return generateBudgetStatus(
    utilization.limit,
    utilization.spent,
    utilization.percentage,
    utilization.remaining,
    statusText,
    emoji
  );
}
