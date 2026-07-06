export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

const GREETINGS = [
  "Hello! I'm Sage, your personal SpendWise finance assistant. How can I help you manage your money today?",
  "Hi there! Ready to review your budgets or log some expenses? Let me know what you need!",
  "Greetings! I can help you track expenses, analyze spending trends, or manage your budgets. What's on your mind?"
];

const EXPENSE_SUMMARIES = [
  "📊 For {timeframe}, you've spent a total of {total}.\n\nTop categories:\n{categories}\n\n💡 {tip}",
  "📉 Your total expenditure for {timeframe} comes to {total}.\n\nHere is how it breaks down:\n{categories}\n\n💡 {tip}",
  "💰 You have spent {total} in total during {timeframe}.\n\nCategory summary:\n{categories}\n\n💡 {tip}"
];

const BUDGET_STATUSES = [
  "💰 Budget Overview:\n• Monthly Budget: {budget}\n• Spent: {spent} ({percentage}%)\n• Remaining: {remaining}\n\nStatus: {statusEmoji} {statusText}",
  "📊 Budget Status:\n• Limit: {budget}\n• Spent so far: {spent} ({percentage}%)\n• Left: {remaining}\n\nWe are currently {statusEmoji} {statusText}."
];

const OUT_OF_SCOPE_RESPONSES = [
  "🚫 I'm not able to help with {action}. I'm designed to help you track and analyze your expenses, income, and budgets within SpendWise.\n\nTry asking me:\n• \"What did I spend this month?\"\n• \"Add ₹500 for groceries\"",
  "⚠️ I cannot assist with {action}. As your SpendWise assistant, I specialize in tracking expenses, incomes, and monthly budgets.\n\nTry asking:\n• \"Show my food expenses\"\n• \"Set my budget to ₹20,000\""
];

const FALLBACKS = [
  "I'm not sure what you mean. Did you want to:\n• See your spending summary\n• Add a new expense\n• Check your budget status",
  "I didn't quite catch that. Here are some things you can ask me:\n• \"What did I spend this month?\"\n• \"Add ₹250 for lunch\"\n• \"Compare this month with last month\""
];

export function getRandomElement<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export function generateGreeting(): string {
  return getRandomElement(GREETINGS);
}

export function generateExpenseSummary(
  timeframe: string,
  total: number,
  categories: { category: string; total: number }[],
  tip?: string
): string {
  const formattedTotal = formatCurrency(total);
  const categoriesStr = categories.length > 0
    ? categories.map(c => `• ${c.category}: ${formatCurrency(c.total)} (${formatPercent((c.total / (total || 1)) * 100)})`).join("\n")
    : "No expenses recorded.";

  const defaultTip = "Track your daily expenses regularly to identify areas where you can save!";
  const finalTip = tip || defaultTip;

  const template = getRandomElement(EXPENSE_SUMMARIES);
  return template
    .replace("{timeframe}", timeframe)
    .replace("{total}", formattedTotal)
    .replace("{categories}", categoriesStr)
    .replace("{tip}", finalTip);
}

export function generateBudgetStatus(
  budgetLimit: number,
  spent: number,
  percentage: number,
  remaining: number,
  statusText: string,
  statusEmoji: string
): string {
  const template = getRandomElement(BUDGET_STATUSES);
  return template
    .replace("{budget}", formatCurrency(budgetLimit))
    .replace("{spent}", formatCurrency(spent))
    .replace("{percentage}", percentage.toFixed(1))
    .replace("{remaining}", formatCurrency(remaining))
    .replace("{statusEmoji}", statusEmoji)
    .replace("{statusText}", statusText);
}

export function generateTrend(
  currentTotal: number,
  previousTotal: number,
  change: number,
  percentChange: number,
  direction: "increased" | "decreased" | "unchanged",
  insight?: string
): string {
  const changeEmoji = direction === "increased" ? "↑" : direction === "decreased" ? "↓" : "→";
  const absChange = formatCurrency(Math.abs(change));
  const changeWord = direction === "increased" ? "increase" : direction === "decreased" ? "decrease" : "no change";
  
  let result = `📈 Spending Trend:\n• Current Period: ${formatCurrency(currentTotal)}\n• Previous Period: ${formatCurrency(previousTotal)}\n• Change: ${changeEmoji} ${absChange} (${changeWord}, ${formatPercent(Math.abs(percentChange))})`;
  
  if (insight) {
    result += `\n\n${insight}`;
  }
  return result;
}

export function generateOutOfScope(action: string): string {
  const template = getRandomElement(OUT_OF_SCOPE_RESPONSES);
  return template.replace(/{action}/g, action);
}

export function generateUnknown(): string {
  return getRandomElement(FALLBACKS);
}
