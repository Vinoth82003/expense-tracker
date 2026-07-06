import { fetchIncome } from "../api-gateway";
import { formatCurrency } from "../response-generator";
import { ExtractedEntities } from "../entity-extractor";
import { GatewayParams } from "../api-gateway";

export async function handleIncomeSummary(entities: ExtractedEntities, params?: GatewayParams): Promise<string> {
  let timeframe = "this month";
  let monthParam: string | undefined;

  if (entities.dateStr === "last month") {
    timeframe = "last month";
    const today = new Date();
    today.setMonth(today.getMonth() - 1);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    monthParam = `${y}-${m}`;
  }

  const options: { month?: string; fromDate?: string; toDate?: string } = {};
  if (monthParam) {
    options.month = monthParam;
  } else if (entities.fromDate && entities.toDate) {
    options.fromDate = entities.fromDate.toISOString();
    options.toDate = entities.toDate.toISOString();
    timeframe = entities.dateStr || "selected period";
  } else {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    options.month = `${y}-${m}`;
  }

  const { income } = await fetchIncome(options, params);

  const total = income.reduce((sum: number, item: any) => sum + item.amount, 0);

  let sourcesStr = "";
  if (income.length > 0) {
    sourcesStr = "\n\nSources:\n" + income.map((inc: any) => `• ${inc.source || "Other"}: ${formatCurrency(inc.amount)}`).join("\n");
  } else {
    sourcesStr = "\nNo income recorded for this period.";
  }

  return `💵 For ${timeframe}, you've earned a total of ${formatCurrency(total)}.${sourcesStr}`;
}
