/**
 * Deterministic financial calculators for SpendWise public tools.
 *
 * Every function here is pure, side-effect free, and unit-tested
 * (`tests/calculators.test.ts`). No randomness, no locale-dependent parsing,
 * no network. All amounts are in rupees unless stated otherwise.
 */

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function roundRupees(value: number): number {
  return Math.round(value);
}

export interface PercentSplit {
  needs: number;
  wants: number;
  savings: number;
}

/**
 * Split a monthly income by three percentages (defaults 50/30/20).
 * Amounts are rounded independently to whole rupees; percentages are used
 * as given and are NOT forced to sum to 100 — the UI owns that validation.
 */
export function splitByPercent(
  monthlyIncome: number,
  needsPct = 50,
  wantsPct = 30,
  savingsPct = 20
): PercentSplit {
  const income = clampNonNegative(monthlyIncome);
  return {
    needs: roundRupees((income * clampNonNegative(needsPct)) / 100),
    wants: roundRupees((income * clampNonNegative(wantsPct)) / 100),
    savings: roundRupees((income * clampNonNegative(savingsPct)) / 100),
  };
}

export interface SalaryBudgetInput {
  /** Monthly take-home (net) salary in rupees. */
  monthlyNet: number;
  /** Fixed monthly commitments: rent, EMIs, bills, premiums. */
  fixedCommitments: number;
  /** Amount the user wants to move to savings/investments first. */
  savingsGoal: number;
  /** Days used for the daily allowance (28–31, default 30). */
  daysInMonth?: number;
}

export interface SalaryBudgetResult {
  /** net − commitments − savingsGoal, floored at 0. */
  dailyPool: number;
  /** dailyPool / daysInMonth, floored at 0. */
  dailyAllowance: number;
  /** commitments + savingsGoal actually allocated out of net. */
  allocated: number;
  /** savingsGoal / monthlyNet as a percentage (0 when net is 0). */
  savingsRatePct: number;
  /** allocated / monthlyNet as a percentage (0 when net is 0). */
  allocatedPct: number;
  /** True when commitments + savingsGoal exceed take-home pay. */
  overAllocated: boolean;
}

/**
 * Monthly salary budget: pay yourself savings first, subtract fixed
 * commitments, divide what remains by the days in the month.
 */
export function salaryBudget(input: SalaryBudgetInput): SalaryBudgetResult {
  const net = clampNonNegative(input.monthlyNet);
  const commitments = clampNonNegative(input.fixedCommitments);
  const savings = clampNonNegative(input.savingsGoal);
  const days =
    input.daysInMonth && input.daysInMonth >= 1 && input.daysInMonth <= 31
      ? Math.floor(input.daysInMonth)
      : 30;

  const allocated = commitments + savings;
  const rawPool = net - allocated;
  const dailyPool = rawPool < 0 ? 0 : roundRupees(rawPool);

  return {
    dailyPool,
    dailyAllowance: roundRupees(dailyPool / days),
    allocated: roundRupees(allocated),
    savingsRatePct: net > 0 ? roundRupees((savings / net) * 100) : 0,
    allocatedPct: net > 0 ? roundRupees((allocated / net) * 100) : 0,
    overAllocated: rawPool < 0,
  };
}

export interface EmergencyFundInput {
  /** Monthly essential living expenses in rupees. */
  monthlyEssentialExpenses: number;
  /** Months of cover to build (1–60, default 6). */
  monthsOfCover: number;
  /** How many months to save toward the target (1–120, default 12). */
  monthsToBuild: number;
}

export interface EmergencyFundResult {
  /** Target corpus = expenses × monthsOfCover. */
  targetCorpus: number;
  /** targetCorpus / monthsToBuild. */
  monthlySavingNeeded: number;
  /** Years of cover for display (monthsOfCover / 12, 1 decimal). */
  coverYears: number;
}

/**
 * Emergency fund planner: target corpus from essential monthly expenses and
 * desired months of cover, plus the monthly saving needed to reach it in
 * the chosen build period.
 */
export function emergencyFund(input: EmergencyFundInput): EmergencyFundResult {
  const expenses = clampNonNegative(input.monthlyEssentialExpenses);
  const coverMonths =
    input.monthsOfCover >= 1 && input.monthsOfCover <= 60
      ? Math.floor(input.monthsOfCover)
      : 6;
  const buildMonths =
    input.monthsToBuild >= 1 && input.monthsToBuild <= 120
      ? Math.floor(input.monthsToBuild)
      : 12;

  const targetCorpus = roundRupees(expenses * coverMonths);
  return {
    targetCorpus,
    monthlySavingNeeded: roundRupees(targetCorpus / buildMonths),
    coverYears: Math.round((coverMonths / 12) * 10) / 10,
  };
}
