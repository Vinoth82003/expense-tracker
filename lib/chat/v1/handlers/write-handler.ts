import {
  createExpense,
  createIncome,
  updateBudget,
  deleteExpense,
  fetchExpenses,
} from "../api-gateway";
import { formatCurrency } from "../response-generator";
import { ExtractedEntities } from "../entity-extractor";
import { GatewayParams } from "../api-gateway";

const CATEGORY_MAP: Record<string, string> = {
  Food: "Needs",
  Transport: "Needs",
  Utilities: "Needs",
  Health: "Needs",
  Shopping: "Wants",
  Entertainment: "Wants",
  Sports: "Wants",
};

export interface HandlerResult {
  reply: string;
  success?: boolean;
  eventType?: "expenseAdded" | "incomeAdded" | "budgetUpdated";
}

export async function handleWrite(
  intent: string,
  entities: ExtractedEntities,
  message: string,
  params?: GatewayParams,
): Promise<HandlerResult> {
  const today = new Date();
  const dateStr = entities.fromDate
    ? entities.fromDate.toISOString().split("T")[0]
    : today.toISOString().split("T")[0];

  // 1. Add Expense
  if (intent === "add_expense") {
    if (!entities.amount) {
      return {
        reply:
          "I couldn't identify the amount. Please specify the amount, e.g., 'Add ₹500 for groceries today'.",
        success: false,
      };
    }

    const subcategory = entities.category || "Other";
    const category = CATEGORY_MAP[subcategory] || "Wants";
    const note = entities.note || subcategory;

    const data = {
      amount: entities.amount,
      category,
      subcategory,
      note,
      date: dateStr,
    };

    const res = await createExpense(data, params);
    return {
      reply: `✅ Added expense of **${formatCurrency(entities.amount)}** under **${subcategory}** (${note}) on ${dateStr}.`,
      success: true,
      eventType: "expenseAdded",
    };
  }

  // 2. Add Income
  if (intent === "add_income") {
    if (!entities.amount) {
      return {
        reply:
          "I couldn't find the amount. Please specify the income amount, e.g., 'Record salary of ₹45,000'.",
        success: false,
      };
    }

    const source = entities.note || "Salary";
    const data = {
      amount: entities.amount,
      source,
      note: entities.note || null,
      date: dateStr,
    };

    const res = await createIncome(data, params);
    return {
      reply: `✅ Recorded income of **${formatCurrency(entities.amount)}** from **${source}** on ${dateStr}.`,
      success: true,
      eventType: "incomeAdded",
    };
  }

  // 3. Update Budget
  if (intent === "update_budget") {
    if (!entities.amount) {
      return {
        reply:
          "Please specify the limit for the budget, e.g., 'Set my budget to ₹20,000'.",
        success: false,
      };
    }

    const monthStr = dateStr.slice(0, 7); // YYYY-MM
    const data = {
      month: monthStr,
      limit: entities.amount,
    };

    const res = await updateBudget(data, params);
    return {
      reply: `✅ Updated monthly budget for **${monthStr}** to **${formatCurrency(entities.amount)}**.`,
      success: true,
      eventType: "budgetUpdated",
    };
  }

  // 4. Delete Expense
  if (intent === "delete_expense" || message.toLowerCase().includes("delete")) {
    // Fetch recent expenses to find a match
    const currentMonth = dateStr.slice(0, 7);
    const { expenses } = await fetchExpenses(currentMonth, params);

    let target = expenses[0]; // default to most recent if none specified
    if (entities.note || entities.category) {
      const match = expenses.find(
        (e: any) =>
          (entities.note &&
            e.note?.toLowerCase().includes(entities.note.toLowerCase())) ||
          (entities.category &&
            e.subcategory?.toLowerCase() === entities.category.toLowerCase()),
      );
      if (match) target = match;
    }

    if (!target) {
      return {
        reply: "I couldn't find any recent expense to delete.",
        success: false,
      };
    }

    await deleteExpense(target.id, params);
    return {
      reply: `✅ Deleted expense of **${formatCurrency(target.amount)}** for **${target.note || target.subcategory}** on ${new Date(target.date).toISOString().split("T")[0]}.`,
      success: true,
      eventType: "expenseAdded", // trigger dashboard sync
    };
  }

  return { reply: "Unknown write action.", success: false };
}
