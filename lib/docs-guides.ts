import type { Doc } from "@/types/docs";

/**
 * Repo-owned guide content for the /docs content hub (Module 08).
 *
 * These guides live in the repository rather than the docs database so their
 * copy, links, and dates are reviewable and testable in CI (`tests/seo-content-hub.test.ts`).
 * Every docs surface — the /docs listing, the article renderer, the sidebar,
 * sitemap.xml, the HTML sitemap, and llms.txt — merges them in via
 * `withStaticGuides()` so a guide can never appear on one surface and be
 * missing from another.
 *
 * Merge rule: the database always wins. If a doc with the same slug exists in
 * the DB (e.g. an admin edited or unpublished it), the repo copy is skipped.
 *
 * Cluster taxonomy (guides only; docs DB keeps its own categories):
 * Budgeting, Expenses, Saving, Salary, Financial Planning, India Finance.
 * New guide categories must come from this list — see Module 08 audit.
 */

/** Fixed publication date for first-release guides (pinned, never `now`). */
const GUIDE_PUBLISHED_AT = new Date("2026-10-06T00:00:00.000Z");

export const GUIDE_CATEGORIES = [
  "Budgeting",
  "Expenses",
  "Saving",
  "Salary",
  "Financial Planning",
  "India Finance",
] as const;

export const STATIC_GUIDES: Doc[] = [
  {
    id: "static-guide-monthly-budgeting",
    title: "How to Make a Monthly Budget That Actually Fits Your Life",
    slug: "monthly-budgeting-guide",
    category: "Budgeting",
    status: "PUBLISHED",
    contentType: "MARKDOWN",
    order: 10,
    helpfulCount: 0,
    notHelpfulCount: 0,
    createdAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    content: `A monthly budget is a plan that gives every rupee of your take-home pay a job before the month spends it for you. This guide walks through a five-step monthly budgeting routine with a worked example in Indian Rupees, and points to the free tools that automate each step.

*Last reviewed: October 2026.*
*General educational information for Indian households — not financial advice.*

## Why budget by the month

Rent, EMIs, school fees, and salaries all move on a monthly cycle, so the month is the natural planning unit. Daily or weekly check-ins are useful for review, but the plan itself should match the cycle your fixed costs follow.

## The five steps

1. **Start from take-home pay.** Budget the money that actually lands in your account after tax and PF deductions — not your CTC.
2. **List fixed commitments first.** Rent, loan EMIs, insurance premiums, utilities, subscriptions. These cannot be renegotiated mid-month.
3. **Pay your savings goal before you spend.** Decide the amount that moves to savings or investments on payday, not at month end.
4. **Plan variable spending in buckets.** Groceries, transport, dining out — give each a monthly ceiling you can actually check.
5. **Leave a small buffer.** Something unplanned always happens; a thin buffer stops one surprise from breaking the whole plan.

## Worked example: ₹55,000 take-home

*This is an illustrative example, not a recommendation — adjust the numbers to your own situation.*

| Item | Amount |
| --- | --- |
| Monthly take-home pay | ₹55,000 |
| Fixed commitments (rent, EMI, utilities) | ₹29,000 |
| Savings goal (set aside on payday) | ₹11,000 |
| Left for variable spending | ₹15,000 |

₹15,000 across 30 days is roughly ₹500 a day for groceries, transport, and daily spends. If a month runs tight, the variable bucket is the one you adjust — fixed commitments and the savings transfer stay put.

## Track the plan, don't just write it

A budget you never check is a wish. Review actual spending once a week and roll what you learn into next month's plan. Our [expense tracking guide](/docs/expense-tracking-guide) covers a lightweight weekly routine, and [Category Insights](/docs/category-insights) explains how SpendWise sorts spending into Needs and Wants.

## Related tools and guides

- [Salary Budget Calculator](/tools/salary-budget-calculator) — turn take-home pay, commitments, and a savings goal into a daily spending allowance.
- [50/30/20 Budget Calculator](/tools/50-30-20-budget-calculator) — a percentage-based split instead of itemised buckets.
- [The 50/30/20 rule explained for Indian salaries](/docs/50-30-20-budgeting-guide) — when percentages beat line items.
- [SpendWise features](/features) — budget limits, alerts, and reports that keep the plan honest.`,
  },
  {
    id: "static-guide-50-30-20",
    title: "The 50/30/20 Rule Explained for Indian Salaries",
    slug: "50-30-20-budgeting-guide",
    category: "Budgeting",
    status: "PUBLISHED",
    contentType: "MARKDOWN",
    order: 11,
    helpfulCount: 0,
    notHelpfulCount: 0,
    createdAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    content: `The 50/30/20 rule splits your after-tax income into three buckets — 50% needs, 30% wants, 20% savings — and gives salaried earners a fast way to check whether a month is balanced. This guide explains what belongs in each bucket, works through an example in Indian Rupees, and shows where the rule stops fitting.

*Last reviewed: October 2026.*
*General educational information for Indian households — not financial advice.*

## Where the rule comes from

The rule is popularised by Elizabeth Warren and Amelia Warren Tyagi in *All Your Worth* (2005). The important detail people skip: it applies to money you actually take home, not your gross or CTC figure.

## What goes where

**Needs (50%)** — expenses you cannot skip without losing shelter, health, or income: rent or EMI, groceries, electricity and water, basic transport, insurance premiums, minimum debt payments.

**Wants (30%)** — choices you can cut without consequence: dining out, streaming subscriptions, travel, shopping beyond essentials, hobbies.

**Savings and debt repayment (20%)** — emergency fund contributions, SIPs, fixed deposits, and extra principal payments on debt.

## Worked example: ₹40,000 take-home

*Illustrative example only:*

- **Needs:** ₹20,000 (rent ₹15,000, utilities and groceries balance)
- **Wants:** ₹12,000
- **Savings:** ₹8,000

If your actual rent alone is ₹18,000 on the same salary, the neat split breaks — which leads to the next section.

## When 50/30/20 does not fit

- **High-rent cities.** When rent alone crosses a third of take-home, a 60/20/20 split is a more honest target. Adjust the ratios, but protect the savings transfer first.
- **Low incomes or single-earner families.** When essentials exceed 50%, the exact ratio matters less than keeping a small, automatic savings habit alive.

## Put it into practice

1. Use the [50/30/20 Budget Calculator](/tools/50-30-20-budget-calculator) to split your monthly income — it handles adjustable percentages and Lakhs/Crores formatting.
2. Record actual spending so the split reflects reality: see the [expense tracking guide](/docs/expense-tracking-guide) and [SpendWise features](/features).
3. Prefer line-item planning instead? Follow the [monthly budgeting guide](/docs/monthly-budgeting-guide).

## Sources

- Elizabeth Warren and Amelia Warren Tyagi, *All Your Worth: The Ultimate Lifetime Money Plan* (2005) — origin of the 50/30/20 framework used throughout this guide.`,
  },
  {
    id: "static-guide-expense-tracking",
    title: "How to Track Your Expenses (and Actually Keep the Habit)",
    slug: "expense-tracking-guide",
    category: "Expenses",
    status: "PUBLISHED",
    contentType: "MARKDOWN",
    order: 12,
    helpfulCount: 0,
    notHelpfulCount: 0,
    createdAt: GUIDE_PUBLISHED_AT,
    updatedAt: GUIDE_PUBLISHED_AT,
    content: `Expense tracking is the habit of recording what you spend and reviewing it regularly, so your budget is based on reality instead of memory. This guide covers a method that survives busy weeks, a worked example, and the mistakes that make most people quit after week two.

*Last reviewed: October 2026.*
*General educational information for Indian households — not financial advice.*

## Why track at all

A budget tells money where to go; tracking tells you where it actually went. Without a record of real spending, every category in your plan is a guess — and guesses are what make budgets feel arbitrary after ten days.

## A method that sticks

1. **Record expenses the day they happen.** A ten-second entry beats a Sunday evening reconstruction from memory.
2. **Sort every entry into a bucket.** Needs, Wants, or Savings — see [Category Insights](/docs/category-insights) for how SpendWise applies the split.
3. **Review for ten minutes once a week.** Look for categories that drifted, not individual purchases you regret.
4. **Adjust next month's plan, not this week's feelings.** Fixes belong in the next budget, not in guilt-driven day-two restrictions.

## Worked example: one week

*Illustrative example:*

| Day | Expense | Bucket |
| --- | --- | --- |
| Monday | ₹240 metro top-up | Needs |
| Wednesday | ₹480 dinner with friends | Wants |
| Friday | ₹1,200 grocery run | Needs |
| Saturday | ₹500 transfer to savings | Savings |

Four entries, under a minute of effort — and by Saturday the week's Needs/Wants balance is visible instead of guessed.

## Tools that do the recording for you

- [Getting Started](/docs/getting-started) — sign in, pick Limit or No-Limit mode, and log your first expense.
- [SpendWise features](/features) — quick-add expenses, category splits, and budget alerts.
- [How It Works](/how-it-works) — onboarding, budget setup, and the PWA install flow.
- [50/30/20 Budget Calculator](/tools/50-30-20-budget-calculator) — convert your split into monthly targets.
- [Salary Budget Calculator](/tools/salary-budget-calculator) — a daily allowance derived from take-home pay.

## Common mistakes

- **Only recording big purchases.** Small daily spends are where budgets actually leak.
- **Tracking without reviewing.** Data with no weekly review changes nothing.
- **Punitive budgets.** A plan that forbids all Wants collapses by week two; keep a small, planned Wants bucket.
- **Confusing planned and actual.** Track what was spent, then compare it against the plan — never overwrite one with the other.`,
  },
];

/**
 * Merge repo-owned guides into a docs query result.
 * The DB always wins on slug conflicts; ordering is left to the caller's
 * original query (guides use order 10+ so they sort after DB seed docs).
 */
export function withStaticGuides<T extends { slug: string }>(dbDocs: T[]): T[] {
  const dbSlugs = new Set(dbDocs.map((doc) => doc.slug));
  const missing = STATIC_GUIDES.filter((guide) => !dbSlugs.has(guide.slug));
  // Safe cast: every call site reads only fields that Doc defines, and Doc is
  // the shape of both the Prisma row and these static records.
  return [...dbDocs, ...(missing as unknown as T[])];
}

export const STATIC_GUIDE_SLUGS: ReadonlySet<string> = new Set(
  STATIC_GUIDES.map((guide) => guide.slug)
);
