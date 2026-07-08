import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BudgetDetails, ExpenseDetails, DateRange } from "./intent";
import { validateBudgetDetails, validateExpenseDetails, validateIncomeDetails } from "./validators";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import { scoreCategories as categoryScoreCategories, SPORTS_KEYWORDS } from "./categories";

// ─── Category helpers ────────────────────────────────────────────────────────

/**
 * Returns all categories available to a user (global defaults + user-created).
 */
async function getUserCategories(userId: string) {
  const [globalCats, userCats] = await Promise.all([
    prisma.category.findMany({ where: { userId: null, isDefault: true } }),
    prisma.category.findMany({ where: { userId } }),
  ]);
  return [...globalCats, ...userCats];
}

type CategoryRecord = Awaited<ReturnType<typeof getUserCategories>>[number];


function matchCategoryFromText(text: string, categories: CategoryRecord[]): CategoryRecord | null {
  const lower = text.toLowerCase();

  // 1. Direct name match
  const direct = categories.find((c) => lower.includes(c.name.toLowerCase()));
  if (direct) return direct;

  // 2. Consolidated keyword alias match (from categories.ts)
  const aliasMatch = importAliasMatch(text, categories);
  if (aliasMatch) return aliasMatch;

  return null;
}

// Alias match using the consolidated categories.ts
function importAliasMatch(text: string, categories: CategoryRecord[]): CategoryRecord | null {
  const scored = categoryScoreCategories(text, categories);
  for (const candidate of scored) {
    const found = categories.find((c) => c.name.toLowerCase() === candidate.category.toLowerCase());
    if (found) return found;
  }
  return null;
}

/**
 * Returns the primary sports keyword found in text, if any.
 */
function extractSportsKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of SPORTS_KEYWORDS) {
    const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${safe}\\b`, "i").test(lower)) return kw;
  }
  return null;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDate(date?: Date) {
  if (!date) return "an appropriate date";
  return format(date, "yyyy-MM-dd");
}

// ─── Read operations ─────────────────────────────────────────────────────────

export async function getExpenseSummary(userId: string, range: DateRange) {
  await logger.info("Chat read: getExpenseSummary", { userId, range: range.label }, "API", undefined, userId);
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: range.start, lte: range.end },
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
      date: { gte: range.start, lte: range.end },
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
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
  });

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = user.monthlyLimit - total;
  const usagePercent = (total / user.monthlyLimit) * 100;
  const status = usagePercent >= 95 ? "dangerously close" : usagePercent >= 75 ? "caution" : "on track";

  return `Your monthly budget is ${formatCurrency(user.monthlyLimit)}. You've spent ${formatCurrency(total)} this month and have ${formatCurrency(remaining)} left. Your current budget status is ${status}.`;
}

// ─── Write operations ─────────────────────────────────────────────────────────

export async function createExpense(userId: string, details: ExpenseDetails) {
  const validation = validateExpenseDetails(details);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const expense = validation.details;
  const providedCategory = expense.category?.toString().trim();
  const note = expense.note || "Created via chat assistant";
  const originalMsg = (details as any).originalMessage || "";
  const date = expense.date ? new Date(expense.date) : new Date();

  // ── Step 1: Load all available categories for this user ──
  const allCategories = await getUserCategories(userId);

  // ── Step 2: Try to match a category using the combined text (note + providedCategory + original message) ──
  // Include originalMessage so that even when parseNote can't extract a clean
  // note (e.g. "Cricket Turf 200 today"), the raw user text is still searched
  // against KEYWORD_ALIASES for correct categorisation.
  const searchText = [
    providedCategory,
    note !== "Created via chat assistant" ? note : "",
    originalMsg
  ].filter(Boolean).join(" ");
  let categoryRecord = matchCategoryFromText(searchText, allCategories);

  // ── Step 3: Sports history check ──
  // If no category matched AND text contains a sports keyword AND "Sports" (or similar) doesn't exist
  if (!categoryRecord && !expense.createCategory) {
    const sportsKw = extractSportsKeyword(searchText);
    if (sportsKw) {
      // Check if any sports-like category exists already
      const sportsCatExists = allCategories.find((c) =>
        ["sports", "fitness"].includes(c.name.toLowerCase())
      );

      if (!sportsCatExists) {
        // Look for past sports expenses categorised under "Other"
        const pastSportsExpenses = await prisma.expense.findMany({
          where: {
            userId,
            OR: SPORTS_KEYWORDS.map((kw) => ({
              note: { contains: kw, mode: "insensitive" as const },
            })),
          },
          take: 5,
          orderBy: { date: "desc" },
        });

        if (pastSportsExpenses.length > 0) {
          const exampleNote = pastSportsExpenses[0].note || "sports activity";
          return {
            success: false,
            message: `I noticed you've logged sports-related expenses like "${exampleNote}" before. Since there's no "Sports" category yet, would you like to create one for "${sportsKw}" and similar activities?`,
            followUp: {
              type: "sports_suggestion",
              payload: {
                missing: "sports_category",
                suggestedCategory: "Sports",
                details: expense,
              },
            },
          };
        }
      }
    }
  }

  // ── Step 3.5: Alias suggestions & confirmation flow ──
  // If no category matched, use consolidated categories.ts for suggestion
  // Only suggest if the user hasn't already confirmed or declined category creation in a follow-up
  if (!categoryRecord && expense.createCategory === undefined) {
    const scored = categoryScoreCategories(searchText, allCategories);
    const bestSuggestion = scored[0];

    if (bestSuggestion) {
      const suggestedName = bestSuggestion.category;
      const suggestedRecord = allCategories.find((c) => c.name.toLowerCase() === suggestedName.toLowerCase());
      if (suggestedRecord) {
        categoryRecord = suggestedRecord;
      } else if (providedCategory) {
        return {
          success: false,
          message: `I couldn't find a category named '${providedCategory}'. Would you like me to create a new category named '${suggestedName}' and add this expense there?`,
          followUp: {
            type: "add_expense_requirements",
            payload: {
              missing: "category",
              suggestedCategory: suggestedName,
              details: {
                ...expense,
                category: suggestedName,
              },
            },
          },
        };
      }
    }
  }

  // ── Step 4: If createCategory flag is set with a name, create that category ──
  if (!categoryRecord && expense.createCategory && providedCategory) {
    try {
      const newCat = await prisma.category.create({
        data: { name: providedCategory, type: "Wants", isDefault: false, userId },
      });
      categoryRecord = newCat;
    } catch (e) {
      console.error("Failed to create category from chat flow:", e);
    }
  }

  // ── Step 5: Default fallback — classify as Needs/Wants heuristically ──
  if (!categoryRecord) {
    const needsKeywords = ["rent", "utility", "utilities", "electricity", "water", "medicine", "hospital", "health", "doctor", "loan"];
    const lowerSearch = searchText.toLowerCase();
    const inferredType = needsKeywords.some((k) => lowerSearch.includes(k)) ? "Needs" : "Wants";
    categoryRecord = { id: "", name: "Other", type: inferredType, isDefault: true, userId: null } as any;
  }

  const subcategory = categoryRecord!.name;
  const categoryType =
    categoryRecord!.type === "Needs" || categoryRecord!.type === "Wants"
      ? categoryRecord!.type
      : "Wants";

  const created = await prisma.expense.create({
    data: {
      amount: expense.amount,
      category: categoryType,
      subcategory,
      note,
      date,
      userId,
    },
  });

  await logger.info(
    "Chat created expense",
    { userId, amount: expense.amount, category: subcategory, date: formatDate(date) },
    "API",
    undefined,
    userId
  );

  return {
    success: true,
    message: `Added an expense of ${formatCurrency(expense.amount)} for ${subcategory} (${categoryType}) on ${formatDate(date)}.`,
    eventType: "expenseAdded",
    data: created,
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

  const created = await prisma.income.create({
    data: {
      amount: income.amount,
      source,
      note,
      date,
      userId,
    },
  });

  await logger.info(
    "Chat created income",
    { userId, amount: income.amount, source, date: formatDate(date) },
    "API",
    undefined,
    userId
  );

  return {
    success: true,
    message: `Added income of ${formatCurrency(income.amount)} on ${formatDate(date)}.`,
    eventType: "incomeAdded",
    data: created,
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
    eventType: "budgetUpdated",
    data: {
      limit: budget.amount,
      expenseMode: "limit"
    },
  };
}
