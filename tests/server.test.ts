import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the server functions by relative path so tests resolve correctly
import * as chatServer from '../lib/chat/server';

// Use factory that creates mocks inside the hoisted mock and exposes them on globalThis
vi.mock('@/lib/prisma', () => {
  const mockExpenseCreate = vi.fn();
  const mockExpenseFindMany = vi.fn();
  const mockUserFindUnique = vi.fn();
  const mockIncomeFindMany = vi.fn();
  const mockIncomeCreate = vi.fn();
  const mockCategoryFindMany = vi.fn();
  const mockCategoryCreate = vi.fn();

  // expose for assertions in tests
  (globalThis as any)._mockExpenseCreate = mockExpenseCreate;
  (globalThis as any)._mockExpenseFindMany = mockExpenseFindMany;
  (globalThis as any)._mockUserFindUnique = mockUserFindUnique;
  (globalThis as any)._mockIncomeFindMany = mockIncomeFindMany;
  (globalThis as any)._mockIncomeCreate = mockIncomeCreate;
  (globalThis as any)._mockCategoryFindMany = mockCategoryFindMany;
  (globalThis as any)._mockCategoryCreate = mockCategoryCreate;

  return {
    prisma: {
      expense: {
        create: mockExpenseCreate,
        findMany: mockExpenseFindMany,
      },
      income: {
        create: mockIncomeCreate,
        findMany: mockIncomeFindMany,
      },
      category: {
        findMany: mockCategoryFindMany,
        create: mockCategoryCreate,
      },
      user: {
        findUnique: mockUserFindUnique,
        update: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('chat server tools', () => {
  it('createExpense: validates and creates an expense', async () => {
    const mockExpenseCreate = (globalThis as any)._mockExpenseCreate as ReturnType<typeof vi.fn>;
    mockExpenseCreate.mockResolvedValue({ id: 'e1' });

    // Mock global and user categories (Food exists globally)
    (globalThis as any)._mockCategoryFindMany.mockResolvedValueOnce([
      { id: 'cat1', name: 'Food', type: 'Wants', isDefault: true, userId: null },
    ]);
    (globalThis as any)._mockCategoryFindMany.mockResolvedValueOnce([]);
    const result = await chatServer.createExpense('user-1', { amount: 123.45, category: 'Food' } as any);

    expect(result.success).toBe(true);
    expect(mockExpenseCreate).toHaveBeenCalled();
  });

  it('createExpense: rejects invalid input', async () => {
    const result = await chatServer.createExpense('user-1', { amount: -10 } as any);
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
    const mockExpenseCreate = (globalThis as any)._mockExpenseCreate as ReturnType<typeof vi.fn>;
    expect(mockExpenseCreate).not.toHaveBeenCalled();
  });

  it('getExpenseSummary: returns a summary when expenses exist', async () => {
    const mockExpenseFindMany = (globalThis as any)._mockExpenseFindMany as ReturnType<typeof vi.fn>;
    mockExpenseFindMany.mockResolvedValueOnce([
      { amount: 100, category: 'Food', subcategory: 'Food' },
      { amount: 50, category: 'Transport', subcategory: 'Transport' },
    ]);

    const range = { start: new Date(0), end: new Date(), label: 'test' } as any;
    const summary = await chatServer.getExpenseSummary('user-1', range);
    expect(typeof summary).toBe('string');
    expect(summary).toContain('total expenses');
  });
});
