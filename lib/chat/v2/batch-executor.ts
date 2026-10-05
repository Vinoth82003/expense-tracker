import { prisma } from "@/lib/prisma";
import { ParsedOperation, QueryKind } from "./batch-extractor";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ENTRY_SOURCE } from "@/lib/transaction-source";

export interface BatchExecutionResult {
  success: boolean;
  reply: string;
  createdExpenses: any[];
  createdIncomes: any[];
  updatedBudget: any;
  eventType?: "expenseAdded" | "incomeAdded" | "budgetUpdated" | "batchTransactionsAdded";
  data?: any;
}

export interface BatchExecutionOptions {
  /**
   * Set only after the user has explicitly agreed to switch from free mode into
   * budget mode. Without it a budget write updates the limit but leaves the
   * user's mode alone — Sage must never flip a free-mode user into budget mode
   * as a side effect of logging a number.
   */
  approvedBudgetMode?: boolean;
}

export async function executeOperationsBatch(
  userId: string,
  operations: ParsedOperation[],
  customReply?: string,
  options: BatchExecutionOptions = {},
): Promise<BatchExecutionResult> {
  const expensesToCreate = operations.filter((op) => op.kind === "EXPENSE");
  const incomesToCreate = operations.filter((op) => op.kind === "INCOME");
  const budgetUpdates = operations.filter((op) => op.kind === "BUDGET_UPDATE");

  const results = await prisma.$transaction(async (tx) => {
    const createdExpenses: any[] = [];
    const createdIncomes: any[] = [];
    let updatedBudget: any = null;

    for (const exp of expensesToCreate) {
      const record = await tx.expense.create({
        data: {
          userId,
          amount: exp.amount,
          category: exp.category || "Needs",
          subcategory: exp.subcategory || "Other",
          note: exp.note || null,
          date: exp.date ? new Date(exp.date) : new Date(),
          entrySource: ENTRY_SOURCE.SAGE,
        },
      });
      createdExpenses.push(record);
    }

    for (const inc of incomesToCreate) {
      const record = await tx.income.create({
        data: {
          userId,
          amount: inc.amount,
          source: inc.source || "Others",
          note: inc.note || null,
          date: inc.date ? new Date(inc.date) : new Date(),
          entrySource: ENTRY_SOURCE.SAGE,
        },
      });
      createdIncomes.push(record);
    }

    for (const bg of budgetUpdates) {
      const month = bg.date ? bg.date.slice(0, 7) : format(new Date(), "yyyy-MM");
      updatedBudget = await tx.budget.upsert({
        where: { userId_month: { userId, month } },
        update: { amount: bg.amount },
        create: { userId, month, amount: bg.amount },
      });
      // expenseMode is only touched on an explicit yes. A free-mode user who
      // asks for a budget gets the limit saved without being silently moved
      // into budget mode — that switch is theirs to make, via the prompt.
      await tx.user.update({
        where: { id: userId },
        data: {
          monthlyLimit: bg.amount,
          ...(options.approvedBudgetMode ? { expenseMode: "limit" } : {}),
        },
      });
    }

    return { createdExpenses, createdIncomes, updatedBudget };
  });

  let eventType: "expenseAdded" | "incomeAdded" | "budgetUpdated" | "batchTransactionsAdded" = "batchTransactionsAdded";
  if (expensesToCreate.length > 0 && incomesToCreate.length === 0 && !budgetUpdates.length) {
    eventType = "expenseAdded";
  } else if (incomesToCreate.length > 0 && expensesToCreate.length === 0 && !budgetUpdates.length) {
    eventType = "incomeAdded";
  } else if (budgetUpdates.length > 0 && !expensesToCreate.length && !incomesToCreate.length) {
    eventType = "budgetUpdated";
  }

  // Construct descriptive reply if customReply is not sufficient
  let reply = customReply;
  if (!reply) {
    const parts: string[] = [];
    if (results.createdExpenses.length > 0) {
      const totalExp = results.createdExpenses.reduce((s, e) => s + e.amount, 0);
      parts.push(`Logged ${results.createdExpenses.length} expense${results.createdExpenses.length > 1 ? "s" : ""} totaling ₹${totalExp.toLocaleString("en-IN")}`);
    }
    if (results.createdIncomes.length > 0) {
      const totalInc = results.createdIncomes.reduce((s, i) => s + i.amount, 0);
      parts.push(`recorded ${results.createdIncomes.length} income${results.createdIncomes.length > 1 ? "s" : ""} totaling ₹${totalInc.toLocaleString("en-IN")}`);
    }
    if (results.updatedBudget) {
      parts.push(`updated your monthly budget to ₹${results.updatedBudget.amount.toLocaleString("en-IN")}`);
    }
    reply = parts.length ? parts.join(", and ") + "!" : "Done!";
  }

  return {
    success: true,
    reply,
    createdExpenses: results.createdExpenses,
    createdIncomes: results.createdIncomes,
    updatedBudget: results.updatedBudget,
    eventType,
    data: {
      expenses: results.createdExpenses,
      incomes: results.createdIncomes,
      budget: results.updatedBudget,
      operations,
    },
  };
}

export async function executeQuery(userId: string, queryKind: QueryKind, queryParam?: string): Promise<string> {
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);
  const monthName = format(now, "MMMM yyyy");

  switch (queryKind) {
    case "EXPENSE_SUMMARY": {
      const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: startMonth, lte: endMonth } },
      });
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      if (expenses.length === 0) {
        return `You don't have any expenses logged for ${monthName} yet. Try saying "spent 300 on food" to add one!`;
      }
      return `For ${monthName}, you have spent ₹${total.toLocaleString("en-IN")} across ${expenses.length} transaction${expenses.length > 1 ? "s" : ""}.`;
    }

    case "INCOME_SUMMARY": {
      const incomes = await prisma.income.findMany({
        where: { userId, date: { gte: startMonth, lte: endMonth } },
      });
      const total = incomes.reduce((s, i) => s + i.amount, 0);
      if (incomes.length === 0) {
        return `You don't have any income logged for ${monthName} yet. You can log income by saying "got salary 50000".`;
      }
      return `Your total income for ${monthName} is ₹${total.toLocaleString("en-IN")} across ${incomes.length} deposit${incomes.length > 1 ? "s" : ""}.`;
    }

    case "BUDGET_STATUS": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { monthlyLimit: true, expenseMode: true },
      });
      const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: startMonth, lte: endMonth } },
      });
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const limit = user?.monthlyLimit || 0;

      if (!limit || user?.expenseMode !== "limit") {
        return `You have spent ₹${totalSpent.toLocaleString("en-IN")} in ${monthName}. You haven't set a monthly budget limit yet — say "set my budget to 30000" to enable spending limits!`;
      }

      const remaining = limit - totalSpent;
      const pct = Math.round((totalSpent / limit) * 100);
      return `Your monthly budget is ₹${limit.toLocaleString("en-IN")}. You have spent ₹${totalSpent.toLocaleString("en-IN")} (${pct}% used) and have ₹${Math.max(0, remaining).toLocaleString("en-IN")} remaining for ${monthName}.`;
    }

    case "CATEGORY_BREAKDOWN": {
      const categoryFilter = queryParam?.trim();
      const whereClause: any = { userId, date: { gte: startMonth, lte: endMonth } };
      if (categoryFilter) {
        whereClause.OR = [
          { subcategory: { contains: categoryFilter, mode: "insensitive" } },
          { category: { contains: categoryFilter, mode: "insensitive" } },
          { note: { contains: categoryFilter, mode: "insensitive" } },
        ];
      }

      const expenses = await prisma.expense.findMany({ where: whereClause });
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      if (expenses.length === 0) {
        return `You haven't logged any spending on ${categoryFilter || "this category"} for ${monthName}.`;
      }
      return `You have spent ₹${total.toLocaleString("en-IN")} on ${categoryFilter || "categories"} in ${monthName} across ${expenses.length} item${expenses.length > 1 ? "s" : ""}.`;
    }

    case "COMPARISON": {
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));
      const [currentExpenses, prevExpenses] = await Promise.all([
        prisma.expense.findMany({ where: { userId, date: { gte: startMonth, lte: endMonth } } }),
        prisma.expense.findMany({ where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } } }),
      ]);
      const curTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
      const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
      const diff = curTotal - prevTotal;

      if (prevTotal === 0 && curTotal === 0) {
        return "Not enough transaction history to compare previous months yet.";
      }
      if (diff > 0) {
        return `You've spent ₹${curTotal.toLocaleString("en-IN")} this month, which is ₹${Math.abs(diff).toLocaleString("en-IN")} higher than last month's ₹${prevTotal.toLocaleString("en-IN")}.`;
      }
      return `You've spent ₹${curTotal.toLocaleString("en-IN")} this month, which is ₹${Math.abs(diff).toLocaleString("en-IN")} lower than last month's ₹${prevTotal.toLocaleString("en-IN")}. Great job!`;
    }

    case "SAVINGS_INSIGHTS":
    default: {
      const [expenses, incomes] = await Promise.all([
        prisma.expense.findMany({ where: { userId, date: { gte: startMonth, lte: endMonth } } }),
        prisma.income.findMany({ where: { userId, date: { gte: startMonth, lte: endMonth } } }),
      ]);
      const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
      const totalInc = incomes.reduce((s, i) => s + i.amount, 0);
      const netSavings = totalInc - totalExp;

      return `Financial Summary for ${monthName}: Total Income is ₹${totalInc.toLocaleString("en-IN")}, Total Expenses are ₹${totalExp.toLocaleString("en-IN")}, leaving a net savings balance of ₹${netSavings.toLocaleString("en-IN")}. Follow the 50/30/20 rule to maximize your savings!`;
    }
  }
}
