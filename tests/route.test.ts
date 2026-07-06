import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/chat/intent', () => ({ getChatIntent: vi.fn() }));
vi.mock('@/lib/chat/server', () => ({
  createExpense: vi.fn(),
  createIncome: vi.fn(),
  updateBudget: vi.fn(),
  getBudgetStatus: vi.fn(),
  getExpenseSummary: vi.fn(),
  getIncomeSummary: vi.fn(),
}));

const { POST } = await import('../app/api/chat/route');
const { getServerSession } = await import('next-auth');
const { getChatIntent } = await import('@/lib/chat/intent');
const chatServer = await import('@/lib/chat/server');

describe('Chat API route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 for unauthenticated requests', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('blocks messages flagged by moderation before intent processing', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com', id: 'user-1' } });
    (getChatIntent as any).mockReturnValue({ type: 'unknown' });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'My credit card number is 4111111111111111' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Message blocked for safety.');
    expect(chatServer.getExpenseSummary).not.toHaveBeenCalled();
  });

  it('dispatches intent to the add_expense tool', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@example.com', id: 'user-1' } });
    (getChatIntent as any).mockReturnValue({ type: 'add_expense', details: { amount: 200, date: new Date('2026-07-06') } });
    (chatServer.createExpense as any).mockResolvedValue({ success: true, message: 'Created' });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Add expense of 200' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.reply).toBe('Created');
    expect(chatServer.createExpense).toHaveBeenCalledWith('user-1', expect.objectContaining({ amount: 200 }));
  });
});
