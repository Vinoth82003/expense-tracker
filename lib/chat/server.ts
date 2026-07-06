import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BudgetDetails, ExpenseDetails, DateRange } from "./intent";
import { validateBudgetDetails, validateExpenseDetails, validateIncomeDetails } from "./validators";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";

const defaultCategories = [
  "Needs",
  "Wants",
  "Food",
  "Transport",
  "Travel",
  "Rent",
  "Utilities",
  "Health",
  "Education",
  "Entertainment",
  "Shopping",
  "Other",
];

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDate(date?: Date) {
  if (!date) return "an appropriate date";
  return format(date, "yyyy-MM-dd");
}

export async function getExpenseSummary(userId: string, range: DateRange) {
  await logger.info("Chat read: getExpenseSummary", { userId, range: range.label }, "API", undefined, userId);
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: range.start,
        lte: range.end,
      },
    },
  });

  if (expenses.length === 0) {
    return `I couldn't find any expenses for ${range.label}. Try adding one so I can help you track spending over time.`;
  }

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach((expense) => {
    const key = expense.subcategory || expense.category || "Other";
    byCategory[key] = (byCategory[key] || 0) + expense.amount;
  });

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`);

  return `For ${range.label}, your total expenses are ${formatCurrency(total)}. Your top categories are ${topCategories.join(", ")}.`;
}

export async function getIncomeSummary(userId: string, range: DateRange) {
  await logger.info("Chat read: getIncomeSummary", { userId, range: range.label }, "API", undefined, userId);
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: range.start,
        lte: range.end,
      },
    },
  });

  if (incomes.length === 0) {
    return `I couldn't find any income records for ${range.label}. Add income details and I can help you compare it with spending.`;
  }

  const total = incomes.reduce((sum, item) => sum + item.amount, 0);
  const sources = Array.from(new Set(incomes.map((income) => income.source))).slice(0, 3);

  return `For ${range.label}, your total income is ${formatCurrency(total)}. The most recent income sources are ${sources.join(", ")}.`;
}

export async function getBudgetStatus(userId: string) {
  await logger.info("Chat read: getBudgetStatus", { userId }, "API", undefined, userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyLimit: true, expenseMode: true },
  });

  if (!user) {
    return "I couldn't read your budget settings. Please make sure your account is configured correctly.";
  }

  if (user.expenseMode !== "limit" || !user.monthlyLimit) {
    return "Budget mode is not enabled or no monthly limit is set. You can set a monthly budget in Settings to get personalized spending guidance.";
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = user.monthlyLimit - total;
  const usagePercent = (total / user.monthlyLimit) * 100;
  const status = usagePercent >= 95 ? "dangerously close" : usagePercent >= 75 ? "caution" : "on track";

  return `Your monthly budget is ${formatCurrency(user.monthlyLimit)}. You've spent ${formatCurrency(total)} this month and have ${formatCurrency(remaining)} left. Your current budget status is ${status}.`;
}

export async function createExpense(userId: string, details: ExpenseDetails) {
  const validation = validateExpenseDetails(details);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const expense = validation.details;
  // Normalize inputs
  const providedCategory = expense.category?.toString().trim();
  const note = expense.note || "Created via chat assistant";


  // Default date to today if not provided
  const date = expense.date ? new Date(expense.date) : new Date();

  // Load categories (global + user) to check existence
  const globalCategories = prisma?.category?.findMany ? (await prisma.category.findMany({ where: { userId: null, isDefault: true } })) || [] : [];
  const userCategories = prisma?.category?.findMany ? (await prisma.category.findMany({ where: { userId } })) || [] : [];
  const allCategories = [...globalCategories, ...userCategories];

  // Helper: case-insensitive find
  const findCategoryByName = (name?: string) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return allCategories.find((c) => c.name.toLowerCase() === lower) || null;
  };

  // Simple keyword -> suggested category mapping
  const keywordMap: Record<string, string> = {
    taxi: "Travel",
    cab: "Travel",
    uber: "Travel",
    bus: "Transport",
    flight: "Travel",
    petrol: "Transport",
    fuel: "Transport",
    groceries: "Food",
    grocery: "Food",
    dinner: "Food",
    lunch: "Food",
    breakfast: "Food",
    hotel: "Travel",
    football: "Sports",
    badminton: "Sports",
    sports: "Sports",
    cinema: "Entertainment",
    movie: "Entertainment",
  };

  // Determine category record to use
  let categoryRecord = findCategoryByName(providedCategory || undefined);

  // If provided category not found, try to suggest via keyword map
  if (!categoryRecord && providedCategory) {
    const lower = providedCategory.toLowerCase();
    const suggestionKey = Object.keys(keywordMap).find((k) => lower.includes(k));
    if (suggestionKey) {
      const suggestedName = keywordMap[suggestionKey];
      const suggestedRecord = findCategoryByName(suggestedName);
      if (suggestedRecord) {
        categoryRecord = suggestedRecord;
      } else if (expense.createCategory) {
        // Create the suggested category for the user
        const newCat = await prisma.category.create({ data: { name: suggestedName, type: "Wants", isDefault: false, userId } });
        categoryRecord = newCat;
      } else {
        // Check user's recent expenses for similar entries to suggest grouping
        const recentSimilar = await prisma.expense.findMany({
          where: {
            userId,
            OR: [
              { subcategory: { contains: providedCategory, mode: "insensitive" } },
              { note: { contains: providedCategory, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { date: "desc" },
        });

        if (recentSimilar.length > 0) {
          return {
            success: false,
            message: `I found similar past expenses (e.g. '${recentSimilar[0].note || recentSimilar[0].subcategory}') that could belong to a category like '${suggestedName}'. Would you like me to create '${suggestedName}' and move future entries there? Reply 'yes' to create, provide a name, or 'no' to add it to Other.`,
          };
        }

        return {
          success: false,
          message: `I couldn't find a category named '${providedCategory}'. Would you like me to create a new category named '${suggestedName}' and add this expense there? Reply 'yes' to create, provide a name, or 'no' to add it to Other.`,
        };
      }
    }
  }

  // If still not found and createCategory flag provided with a name, create it
  if (!categoryRecord && expense.createCategory && providedCategory) {
    try {
      const newCat = await prisma.category.create({ data: { name: providedCategory, type: "Wants", isDefault: false, userId } });
      categoryRecord = newCat;
    } catch (e) {
      console.error("Failed to create category from chat flow:", e);
    }
  }

  // Default fallback
  if (!categoryRecord) {
    // classify as Needs/Wants heuristically using keywords
    const needsKeywords = ["rent", "utility", "utilities", "electricity", "water", "medicine", "hospital", "health", "doctor", "loan"];
    const lowerNote = (note || "").toLowerCase();
    const inferredType = needsKeywords.some((k) => lowerNote.includes(k) || (providedCategory && providedCategory.toLowerCase().includes(k))) ? "Needs" : "Wants";
    // use 'Other' subcategory
    categoryRecord = { id: "", name: "Other", type: inferredType, isDefault: true, userId: null } as any;
  }

  const subcategory = categoryRecord!.name;

  await prisma.expense.create({
    data: {
      amount: expense.amount,
      category: categoryRecord!.type === "Needs" || categoryRecord!.type === "Wants" ? categoryRecord!.type : "Needs",
      subcategory,
      note,
      date,
      userId,
    },
  });

  await logger.info("Chat created expense", { userId, amount: expense.amount, category: subcategory, date: formatDate(date) }, "API", undefined, userId);

  return {
    success: true,
    message: `Added an expense of ${formatCurrency(expense.amount)} for ${subcategory} on ${formatDate(date)}.`,
  };
}

export async function createIncome(userId: string, details: ExpenseDetails) {
  const validation = validateIncomeDetails(details);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const income = validation.details;
  const date = income.date ? new Date(income.date) : new Date();
  const source = income.note || "Income";
  const note = income.note ? income.note : "Created via chat assistant";

  await prisma.income.create({
    data: {
      amount: income.amount,
      source,
      note,
      date,
      userId,
    },
  });

  await logger.info("Chat created income", { userId, amount: income.amount, source, date: formatDate(date) }, "API", undefined, userId);

  return {
    success: true,
    message: `Added income of ${formatCurrency(income.amount)} on ${formatDate(date)}.`,
  };
}

export async function updateBudget(userId: string, details: BudgetDetails) {
  const validation = validateBudgetDetails(details);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const budget = validation.details;
  await prisma.user.update({
    where: { id: userId },
    data: {
      expenseMode: "limit",
      monthlyLimit: budget.amount,
    },
  });

  await logger.info("Chat updated budget", { userId, amount: budget.amount }, "API", undefined, userId);

  return {
    success: true,
    message: `Your monthly budget has been set to ${formatCurrency(budget.amount)}.`,
  };
}
