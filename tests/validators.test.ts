import { describe, it, expect } from 'vitest';
import { validateExpenseDetails, validateIncomeDetails, validateBudgetDetails } from '../lib/chat/validators';

describe('Chat validators', () => {
  it('rejects missing expense details', () => {
    const result = validateExpenseDetails(undefined as any);
    expect(result.valid).toBe(false);
    expect((result as any).message).toBeDefined();
  });

  it('accepts valid expense details', () => {
    const result = validateExpenseDetails({ amount: 250 } as any);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.details.amount).toBe(250);
    }
  });

  it('rejects non-positive expense amount', () => {
    const result = validateExpenseDetails({ amount: -5 } as any);
    expect(result.valid).toBe(false);
  });

  it('validates income details', () => {
    const result = validateIncomeDetails({ amount: 2000 } as any);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.details.amount).toBe(2000);
  });

  it('validates budget details', () => {
    const result = validateBudgetDetails({ amount: 10000 } as any);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.details.amount).toBe(10000);
  });
});
