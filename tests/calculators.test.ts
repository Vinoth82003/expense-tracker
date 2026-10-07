import { describe, it, expect } from "vitest";
import {
  splitByPercent,
  salaryBudget,
  emergencyFund,
} from "@/lib/calculators";

describe("splitByPercent (50/30/20)", () => {
  it("splits default 50/30/20 exactly", () => {
    expect(splitByPercent(50000)).toEqual({
      needs: 25000,
      wants: 15000,
      savings: 10000,
    });
  });

  it("honours custom percentages", () => {
    expect(splitByPercent(40000, 60, 20, 20)).toEqual({
      needs: 24000,
      wants: 8000,
      savings: 8000,
    });
  });

  it("rounds to whole rupees deterministically", () => {
    expect(splitByPercent(9999)).toEqual({ needs: 5000, wants: 3000, savings: 2000 });
  });

  it("returns zeros for zero, negative, or non-finite income", () => {
    expect(splitByPercent(0)).toEqual({ needs: 0, wants: 0, savings: 0 });
    expect(splitByPercent(-5000)).toEqual({ needs: 0, wants: 0, savings: 0 });
    expect(splitByPercent(NaN)).toEqual({ needs: 0, wants: 0, savings: 0 });
    expect(splitByPercent(Infinity)).toEqual({ needs: 0, wants: 0, savings: 0 });
  });

  it("clamps negative percentages to zero", () => {
    expect(splitByPercent(10000, -10, 30, 20)).toEqual({
      needs: 0,
      wants: 3000,
      savings: 2000,
    });
  });

  it("is deterministic across repeated calls", () => {
    const a = splitByPercent(123456.78, 55, 25, 20);
    const b = splitByPercent(123456.78, 55, 25, 20);
    expect(a).toEqual(b);
  });
});

describe("salaryBudget", () => {
  it("computes daily pool after commitments and savings", () => {
    const r = salaryBudget({
      monthlyNet: 60000,
      fixedCommitments: 25000,
      savingsGoal: 10000,
      daysInMonth: 30,
    });
    expect(r.dailyPool).toBe(25000);
    expect(r.dailyAllowance).toBe(833);
    expect(r.allocated).toBe(35000);
    expect(r.savingsRatePct).toBe(17);
    expect(r.allocatedPct).toBe(58);
    expect(r.overAllocated).toBe(false);
  });

  it("floors the pool at zero when over-allocated", () => {
    const r = salaryBudget({
      monthlyNet: 20000,
      fixedCommitments: 18000,
      savingsGoal: 5000,
    });
    expect(r.dailyPool).toBe(0);
    expect(r.dailyAllowance).toBe(0);
    expect(r.overAllocated).toBe(true);
  });

  it("respects real month lengths", () => {
    const feb = salaryBudget({
      monthlyNet: 31000,
      fixedCommitments: 0,
      savingsGoal: 0,
      daysInMonth: 28,
    });
    expect(feb.dailyAllowance).toBe(1107);
    const long = salaryBudget({
      monthlyNet: 31000,
      fixedCommitments: 0,
      savingsGoal: 0,
      daysInMonth: 31,
    });
    expect(long.dailyAllowance).toBe(1000);
  });

  it("falls back to 30 days for out-of-range day counts", () => {
    const r = salaryBudget({
      monthlyNet: 30000,
      fixedCommitments: 0,
      savingsGoal: 0,
      daysInMonth: 99,
    });
    expect(r.dailyAllowance).toBe(1000);
  });

  it("returns safe zeros for zero/negative net pay", () => {
    const r = salaryBudget({
      monthlyNet: 0,
      fixedCommitments: 5000,
      savingsGoal: 1000,
    });
    expect(r.dailyPool).toBe(0);
    expect(r.savingsRatePct).toBe(0);
    expect(r.allocatedPct).toBe(0);
    expect(r.overAllocated).toBe(true);
  });
});

describe("emergencyFund", () => {
  it("targets 6 months of essential expenses by default", () => {
    const r = emergencyFund({
      monthlyEssentialExpenses: 40000,
      monthsOfCover: 6,
      monthsToBuild: 12,
    });
    expect(r.targetCorpus).toBe(240000);
    expect(r.monthlySavingNeeded).toBe(20000);
    expect(r.coverYears).toBe(0.5);
  });

  it("supports custom cover and build windows", () => {
    const r = emergencyFund({
      monthlyEssentialExpenses: 25000,
      monthsOfCover: 9,
      monthsToBuild: 18,
    });
    expect(r.targetCorpus).toBe(225000);
    expect(r.monthlySavingNeeded).toBe(12500);
    expect(r.coverYears).toBe(0.8);
  });

  it("clamps out-of-range windows to safe defaults", () => {
    const r = emergencyFund({
      monthlyEssentialExpenses: 30000,
      monthsOfCover: 0,
      monthsToBuild: 0,
    });
    expect(r.targetCorpus).toBe(180000); // 6-month default
    expect(r.monthlySavingNeeded).toBe(15000); // 12-month default
  });

  it("returns zeros for non-positive expenses", () => {
    const r = emergencyFund({
      monthlyEssentialExpenses: -1,
      monthsOfCover: 6,
      monthsToBuild: 12,
    });
    expect(r.targetCorpus).toBe(0);
    expect(r.monthlySavingNeeded).toBe(0);
  });

  it("is deterministic", () => {
    const input = {
      monthlyEssentialExpenses: 47321.5,
      monthsOfCover: 7,
      monthsToBuild: 15,
    };
    expect(emergencyFund(input)).toEqual(emergencyFund(input));
  });
});
