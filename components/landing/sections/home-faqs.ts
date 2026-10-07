/**
 * The homepage FAQ list, shared by the visible FAQ accordion and the
 * FAQPage JSON-LD (Module 10). A single source is what keeps the two in
 * parity — FAQPage structured data must describe FAQs a visitor can
 * actually read on the page.
 *
 * Plain module (no "use client") so both the server page (schema) and the
 * client section (accordion) can import the same array.
 */
export const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: "What is SpendWise?",
    a: "SpendWise is a smart expense tracker built for India. It auto-categorizes your expenses, tracks budgets in real time, and gives you AI-powered insights into where your money goes — all from your phone.",
  },
  {
    q: "How does Sage AI work?",
    a: "Sage AI analyzes your actual transactions to surface spending patterns, detect anomalies, and answer plain-language questions like \"Where did my money go this month?\" Every number it shows comes directly from your tracked data — no guessed or fabricated stats.",
  },
  {
    q: "Is SpendWise free to use?",
    a: "Yes. SpendWise offers a free plan with core tracking, budgeting, and AI insights. No hidden fees, no credit card required to get started.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. We use Google OAuth 2.0 for authentication, encrypt all data in transit, and use secure password hashing. Your data stays in your account — we never sell it, and it is only processed by the services that run SpendWise (hosting, authentication, and AI analysis), as described in our Privacy Policy.",
  },
  {
    q: "Can teams use SpendWise?",
    a: "SpendWise is designed for personal finance tracking. For team or business expense management, check out our Groups feature for splitting shared expenses with friends and family.",
  },
  {
    q: "How accurate is the AI?",
    a: "Sage AI works only with your real transaction data — the same records you see in your reports — not generic financial content. As with any tool, check important figures against your bank statements before making decisions.",
  },
  {
    q: "How long does setup take?",
    a: "About 2 minutes. Sign in with Google, and you're ready to start logging expenses. No lengthy onboarding or complex configuration needed.",
  },
  {
    q: "Does SpendWise support recurring expenses?",
    a: "Currently, SpendWise supports manual expense entry. You can log subscriptions, rent, EMIs, and SIPs as regular expenses and track them in your reports.",
  },
];
