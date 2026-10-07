/**
 * The four how-it-works steps, shared by the visible HowItWorksClient
 * timeline and the HowTo JSON-LD (Module 10 parity rule).
 *
 * Plain module (no "use client") so the server page can build the HowTo
 * structured data from the exact steps a visitor reads on the page.
 */
export interface HowItWorksStep {
  number: string;
  chip: string;
  title: string;
  description: string;
  bullets: string[];
}

export const steps: HowItWorksStep[] = [
  {
    number: "01",
    chip: "Getting Started",
    title: "Create your free account",
    description:
      "Sign up with Google or email in seconds. No credit card required, no passwords to remember — just instant access to your personal finance dashboard.",
    bullets: [
      "Secure Google OAuth — one tap sign-in",
      "Email + password option available",
      "Industry-standard security with encryption in transit",
    ],
  },
  {
    number: "02",
    chip: "Daily Use",
    title: "Log expenses as you spend",
    description:
      "Record every transaction the moment it happens. Categorize into Needs and Wants with a single tap — your data stays organized automatically.",
    bullets: [
      "Quick expense entry with ₹ support",
      "Auto-categorize Needs vs Wants",
      "Track income alongside expenses",
    ],
  },
  {
    number: "03",
    chip: "AI Intelligence",
    title: "Get insights, not just numbers",
    description:
      "Sage AI analyzes your spending patterns and surfaces the why behind your money — identifying leaks, overlaps, and opportunities you'd miss on your own.",
    bullets: [
      "Behavioral spending pattern detection",
      "Subscription overlap identification",
      "Personalized savings recommendations",
    ],
  },
  {
    number: "04",
    chip: "Growth",
    title: "Watch your wealth grow",
    description:
      "Visualize progress with real-time dashboards, export Indian financial year reports, and set smart budget limits that alert you before you overspend.",
    bullets: [
      "April–March FY reports with ₹ Lakhs/Crores",
      "Budget alerts at 80% spend threshold",
      "Downloadable CSV & PDF exports",
    ],
  },
];
