import { BudgetDetails, ExpenseDetails } from "./intent";

type ValidationResult<T> =
  | { valid: true; details: T }
  | { valid: false; message: string };

export type ValidExpenseDetails = ExpenseDetails & { amount: number };
export type ValidBudgetDetails = BudgetDetails & { amount: number };

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function validateExpenseDetails(details: ExpenseDetails | undefined): ValidationResult<ValidExpenseDetails> {
  if (!details) {
    return { valid: false, message: "Missing expense details." };
  }

  if (!isPositiveNumber(details.amount)) {
    return {
      valid: false,
      message:
        "I couldn't find a valid expense amount. Please say something like: Add an expense of ₹250 for dinner today.",
    };
  }

  if (details.date && !(details.date instanceof Date) && typeof details.date !== "string") {
    return { valid: false, message: "The expense date was not in a valid format." };
  }

  return { valid: true, details: { ...details, amount: Number(details.amount) } };
}

export function validateIncomeDetails(details: ExpenseDetails | undefined): ValidationResult<ValidExpenseDetails> {
  if (!details) {
    return { valid: false, message: "Missing income details." };
  }

  if (!isPositiveNumber(details.amount)) {
    return {
      valid: false,
      message:
        "I couldn't find a valid income amount. Please say something like: Add income of ₹20,000 for salary today.",
    };
  }

  if (details.date && !(details.date instanceof Date) && typeof details.date !== "string") {
    return { valid: false, message: "The income date was not in a valid format." };
  }

  return { valid: true, details: { ...details, amount: Number(details.amount) } };
}

export function validateBudgetDetails(details: BudgetDetails | undefined): ValidationResult<ValidBudgetDetails> {
  if (!details) {
    return { valid: false, message: "Missing budget details." };
  }

  if (!isPositiveNumber(details.amount)) {
    return {
      valid: false,
      message: "I couldn't find a valid budget amount. Please say something like: Set my monthly budget to ₹10,000.",
    };
  }

  return { valid: true, details: { ...details, amount: Number(details.amount) } };
}
