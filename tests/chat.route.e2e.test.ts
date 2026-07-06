import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/chat/intent', () => ({ getChatIntent: vi.fn() }));
vi.mock('@/lib/prisma', () => {
  const mockExpenseCreate = vi.fn();
  const mockExpenseFindMany = vi.fn();
  const mockIncomeFindMany = vi.fn();
  const mockIncomeCreate = vi.fn();
  const mockUserFindUnique = vi.fn();
  const mockUserUpdate = vi.fn();
  const mockCategoryFindMany = vi.fn();
  const mockCategoryCreate = vi.fn();

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
      user: {
        findUnique: mockUserFindUnique,
        update: mockUserUpdate,
      },
      category: {
        findMany: mockCategoryFindMany,
        create: mockCategoryCreate,
      },
    },
  };
});

const { POST } = await import('../app/api/chat/route');
const { getServerSession } = await import('next-auth');
const { getChatIntent } = await import('@/lib/chat/intent');
const { prisma } = await import('@/lib/prisma');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Chat API route end-to-end with mocked Prisma', () => {
  it('creates an expense via chat route and mocked Prisma', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com', id: 'user-1' } });
    (getChatIntent as any).mockReturnValue({ type: 'add_expense', details: { amount: 75, category: 'Food', date: new Date('2026-07-06') } });
    (prisma.category.findMany as any)
      .mockResolvedValueOnce([{ id: 'cat1', name: 'Food', type: 'Wants', isDefault: true, userId: null }]) // global
      .mockResolvedValueOnce([]); // user categories
    (prisma.expense.create as any).mockResolvedValue({ id: 'exp1', amount: 75 });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Add expense of 75' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.reply).toContain('₹75.00');
    expect(prisma.expense.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amount: 75,
        userId: 'user-1',
      }),
    }));
  });

  it('returns budget status via chat route using mocked Prisma', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com', id: 'user-1' } });
    (getChatIntent as any).mockReturnValue({ type: 'budget_status' });
    (prisma.user.findUnique as any).mockResolvedValue({ monthlyLimit: 1000, expenseMode: 'limit' });
    (prisma.expense.findMany as any).mockResolvedValue([{ amount: 250, date: new Date() }]);

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How am I doing against my budget?' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.reply).toContain('Your monthly budget is');
    expect(body.reply).toContain('₹250.00');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' }, select: { monthlyLimit: true, expenseMode: true } }));
  });
});
