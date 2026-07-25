import {
  Receipt,
  Brain,
  MessageSquare,
  Target,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
  iconBg: string;
  iconColor: string;
}

export const features: Feature[] = [
  {
    icon: Receipt,
    title: "Expense & Income Tracking",
    description:
      "Log expenses and income manually with a clean, fast interface. Categorize every transaction into Needs or Wants with custom subcategories that match your life.",
    details: [
      "Create, edit, and delete expenses with amount, category, subcategory, date, and notes",
      "Track income by source — salary, freelance, investments, gifts, and more",
      "Two-tier categorization: Needs vs. Wants with unlimited custom subcategories",
      "Search, filter by month or custom date range, and export to CSV",
    ],
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: Brain,
    title: "AI Forensic Analysis",
    description:
      "Powered by Google Gemini, SpendWise generates a deep financial analysis of your entire transaction history — not just summaries, but actionable forensic insights.",
    details: [
      "Spending pattern analysis with anomaly detection and metric cards",
      "Budget burn-rate forecasting with reallocation tips",
      "Income vs. expense gap analysis with savings rate trends over time",
      "Hypothetical stress-test scenarios (e.g. 25% income dip) with specific cuts",
      "Actionable suggestions with estimated monthly savings per recommendation",
    ],
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    icon: MessageSquare,
    title: "Natural Language Chat",
    description:
      "Talk to SpendWise in plain English. Add expenses, check budgets, or compare months — the chat understands your intent and handles multi-turn conversations.",
    details: [
      'Add expenses by typing naturally: "spent 300 on groceries yesterday"',
      "Auto-categorizes transactions with confidence scoring — prompts you when unsure",
      "Query summaries: how much did I spend this month or compare last month",
      "Multi-turn conversations with 15-minute session state for follow-ups",
      "On-the-fly category creation and duplicate detection",
    ],
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: Target,
    title: "Smart Budgeting",
    description:
      "Set a single monthly budget limit and track your spending against it in real time. Get email alerts before you overshoot — not after.",
    details: [
      "Monthly budget mode with live budget-left counter on the dashboard",
      "Automated email alerts when spending crosses the 80% threshold",
      "50/30/20 rule analysis with radar chart comparing actual vs. recommended",
      "Daily spending limit calculator that adjusts for remaining days in the month",
    ],
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: BarChart3,
    title: "Interactive Reports",
    description:
      "Visualize your finances with Recharts-powered charts across multiple time views. Spot trends, compare periods, and understand where every rupee goes.",
    details: [
      "Area, bar, radar, and donut charts with interactive cross-filtering",
      "View by day, week, month, or preset ranges (3M, 6M, 1Y, all time)",
      "Period-over-period comparison: current vs. previous period side by side",
      "Top expenditure breakdown and category distribution with click-to-filter",
      "Smart health score and optimization tips based on your spending profile",
    ],
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    icon: Users,
    title: "Group Expense Splitting",
    description:
      "Create groups with friends or family, log shared expenses, and track who owes what. Supports equal, count-based, and custom split types.",
    details: [
      "Create groups and invite members via email with token-based invite links",
      "Three split types: equal, count-based, and custom amounts",
      "Per-member balance tracking across all group expenses",
      "Payment status tracking: pending, partial, and paid",
      "Cross-group balance summary so you always know your net position",
    ],
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
  },
];

export interface FAQ {
  q: string;
  a: string;
}

export const faqs: FAQ[] = [
  {
    q: "Does SpendWise auto-detect UPI transactions?",
    a: "No. SpendWise is a manual expense tracker — you log transactions yourself. This keeps your bank credentials fully private. You can add expenses quickly via the chat interface by typing naturally.",
  },
  {
    q: "How does the AI forensic analysis work?",
    a: "SpendWise sends your complete expense and income history to Google Gemini 2.5 Flash, which generates a structured report covering spending patterns, budget advice, income trends, emergency fund status, and actionable suggestions with estimated savings. Notes are sanitized (emails, phone numbers redacted) before sending.",
  },
  {
    q: "Can I set per-category budgets?",
    a: "Currently, SpendWise supports a single monthly budget limit. The dashboard and reports show a 50/30/20 analysis comparing your actual Needs/Wants/Savings split against the recommended ratio, so you can see where to adjust.",
  },
  {
    q: "Is my financial data secure?",
    a: "Yes. SpendWise uses Google OAuth 2.0 or email+password authentication with bcrypt hashing. Optional email-based 2FA adds an extra layer. All data is encrypted in transit (HSTS) and we enforce strict CSP, XSS protection, and frame-origin restrictions.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export all your expenses and income as a CSV file from the Settings page or the Expenses/Income pages. The AI analysis report can also be downloaded as a PDF.",
  },
  {
    q: "What is the 50/30/20 rule analysis?",
    a: "The dashboard and reports include a radar chart comparing your actual spending across Needs, Wants, and Savings against the recommended 50/30/20 split. It shows whether you're overshooting on lifestyle spending or building enough savings.",
  },
  {
    q: "How does the chat input work?",
    a: "The chat uses intent classification (not a general AI chatbot). It understands commands like 'add expense 500 for groceries', 'how much did I spend this month', or 'compare last month'. It handles multi-turn conversations — if you forget a date, it asks for one.",
  },
  {
    q: "Can I use SpendWise as a PWA?",
    a: "Yes. SpendWise is a Progressive Web App — you can install it on your home screen for a native app experience. It uses a service worker for caching static assets. Expense logging requires an internet connection.",
  },
];

export interface ComparisonRow {
  feature: string;
  spendwise: boolean | string;
  spreadsheets: boolean | string;
  otherApps: boolean | string;
}

export const comparisonRows: ComparisonRow[] = [
  { feature: "AI Financial Analysis", spendwise: true, spreadsheets: false, otherApps: "Partial" },
  { feature: "Natural Language Input", spendwise: true, spreadsheets: false, otherApps: false },
  { feature: "50/30/20 Rule Analysis", spendwise: true, spreadsheets: "Manual", otherApps: false },
  { feature: "Group Expense Splitting", spendwise: true, spreadsheets: false, otherApps: "Partial" },
  { feature: "Interactive Charts & Reports", spendwise: true, spreadsheets: "Manual", otherApps: "Basic" },
  { feature: "Budget Alerts (Email)", spendwise: true, spreadsheets: false, otherApps: "Partial" },
  { feature: "PWA Installable App", spendwise: true, spreadsheets: false, otherApps: "Partial" },
  { feature: "Free Forever", spendwise: true, spreadsheets: true, otherApps: "Partial" },
];
