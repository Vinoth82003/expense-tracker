import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/chat/intent", () => ({ getChatIntent: vi.fn() }));
vi.mock("@/lib/prisma", () => {
  const mockExpenseCreate = vi.fn();
  const mockExpenseFindMany = vi.fn();
  const mockIncomeCreate = vi.fn();
  const mockCategoryFindMany = vi.fn();
  const mockCategoryCreate = vi.fn();
  const mockUserFindUnique = vi.fn();

  return {
    prisma: {
      expense: {
        create: mockExpenseCreate,
        findMany: mockExpenseFindMany,
      },
      income: {
        create: mockIncomeCreate,
      },
      category: {
        findMany: mockCategoryFindMany,
        create: mockCategoryCreate,
      },
      user: {
        findUnique: mockUserFindUnique,
      },
    },
  };
});

const { POST } = await import("../app/api/chat/route");
const { getServerSession } = await import("next-auth");
const { getChatIntent } = await import("@/lib/chat/intent");
const { prisma } = await import("@/lib/prisma");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Chat Multi-Turn Flows (Date Prompts & Category Confirmation)", () => {
  describe("Expense creation with missing date", () => {
    it("returns date prompt when user omits date", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      // intent without date
      (getChatIntent as any).mockReturnValue({
        type: "add_expense",
        details: { amount: 100, category: "Food" },
      });
      (prisma.category.findMany as any).mockResolvedValue([
        { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
      ]);

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Add 100 for food" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reply).toContain("didn't catch a date");
      expect(body.success).toBe(false);
      expect(body.followUp?.type).toBe("add_expense_requirements");
      expect(body.followUp?.payload?.missing).toBe("date");
    });

    it("creates expense when date is provided in follow-up", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      // Structured follow-up with date
      (prisma.category.findMany as any).mockResolvedValue([
        { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
      ]);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp1",
        amount: 100,
        date: new Date("2026-07-06"),
      });

      const followUpDate = new Date("2026-07-06").toISOString();
      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: { amount: 100, category: "Food", date: followUpDate },
          intentType: "add_expense",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reply).toContain("₹100.00");
      expect(body.reply).toContain("Food");
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 100,
            userId: "user-1",
          }),
        })
      );
    });
  });

  describe("Category detection & suggestion", () => {
    it("suggests category via keyword mapping when category not found", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (getChatIntent as any).mockReturnValue({
        type: "add_expense",
        details: {
          amount: 50,
          category: "taxi",
          date: new Date().toISOString(),
        },
      });
      // First call: global categories (empty), Second call: user categories (no Travel)
      (prisma.category.findMany as any)
        .mockResolvedValueOnce([]) // global categories (empty)
        .mockResolvedValueOnce([]); // user categories (empty - so no Travel exists)
      (prisma.expense.findMany as any).mockResolvedValue([]); // no recent similar

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Add 50 for taxi today" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reply).toContain("couldn't find a category");
      expect(body.success).toBe(false);
      expect(body.followUp?.type).toBe("add_expense_requirements");
      expect(body.followUp?.payload?.missing).toBe("category");
    });

    it("creates expense with suggested category when user confirms", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      // Follow-up with createCategory flag
      (prisma.category.findMany as any).mockResolvedValue([
        { id: "cat2", name: "Travel", type: "Wants", isDefault: false, userId: "user-1" },
      ]);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp2",
        amount: 50,
      });

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: {
            amount: 50,
            category: "taxi",
            date: new Date().toISOString(),
            createCategory: true,
          },
          intentType: "add_expense",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reply).toContain("₹50.00");
      expect(prisma.expense.create).toHaveBeenCalled();
    });
  });

  describe("Category creation flow", () => {
    it("creates new category when user provides name in follow-up", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (prisma.category.findMany as any).mockResolvedValue([]); // no existing categories
      const newCat = { id: "newcat1", name: "Gaming", type: "Wants", isDefault: false, userId: "user-1" };
      (prisma.category.create as any).mockResolvedValue(newCat);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp3",
        amount: 200,
      });

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: {
            amount: 200,
            category: "Gaming",
            date: new Date().toISOString(),
            createCategory: true,
          },
          intentType: "add_expense",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.reply).toContain("₹200.00");
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Gaming",
            userId: "user-1",
          }),
        })
      );
    });

    it("falls back to 'Other' category when user declines to create", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (prisma.category.findMany as any).mockResolvedValue([]); // no existing
      (prisma.expense.findMany as any).mockResolvedValue([]); // no similar
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp4",
        amount: 75,
      });

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: {
            amount: 75,
            category: "UnknownCategory",
            date: new Date().toISOString(),
            createCategory: false,
          },
          intentType: "add_expense",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.reply).toContain("Other");
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subcategory: "Other",
          }),
        })
      );
    });
  });

  describe("Needs/Wants inference", () => {
    it("infers 'Needs' category for utilities expense", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (getChatIntent as any).mockReturnValue({
        type: "add_expense",
        details: {
          amount: 500,
          note: "electricity bill",
          date: new Date().toISOString(),
        },
      });
      (prisma.category.findMany as any).mockResolvedValue([]);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp5",
        amount: 500,
      });

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Add 500 for electricity bill" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "Needs",
          }),
        })
      );
    });

    it("infers 'Wants' category for entertainment expense", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (getChatIntent as any).mockReturnValue({
        type: "add_expense",
        details: {
          amount: 300,
          category: "movie",
          date: new Date().toISOString(),
          note: "movie ticket",
        },
      });
      // Mock Entertainment category existing
      (prisma.category.findMany as any)
        .mockResolvedValueOnce([]) // global categories
        .mockResolvedValueOnce([
          { id: "cat-ent", name: "Entertainment", type: "Wants", isDefault: false, userId: "user-1" },
        ]); // user categories
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp6",
        amount: 300,
      });

      const request = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Add 300 for movie" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "Wants",
          }),
        })
      );
    });
  });

  describe("Multi-turn integration", () => {
    it("handles complete flow: missing date → prompt → date provided → expense created", async () => {
      // Step 1: Initial request without date
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (getChatIntent as any).mockReturnValue({
        type: "add_expense",
        details: { amount: 150, category: "Food" },
      });
      (prisma.category.findMany as any).mockResolvedValue([
        { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
      ]);

      const request1 = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Add 150 for food" }),
      });

      const response1 = await POST(request1);
      const body1 = await response1.json();
      expect(body1.success).toBe(false);
      expect(body1.followUp?.payload?.missing).toBe("date");

      // Step 2: Follow-up with date
      vi.resetAllMocks();
      (getServerSession as any).mockResolvedValue({
        user: { email: "user@example.com", id: "user-1" },
      });
      (prisma.category.findMany as any).mockResolvedValue([
        { id: "cat1", name: "Food", type: "Wants", isDefault: true, userId: null },
      ]);
      (prisma.expense.create as any).mockResolvedValue({
        id: "exp7",
        amount: 150,
      });

      const followUpDate = new Date("2026-07-06").toISOString();
      const request2 = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: {
            amount: 150,
            category: "Food",
            date: followUpDate,
          },
          intentType: "add_expense",
        }),
      });

      const response2 = await POST(request2);
      const body2 = await response2.json();
      expect(body2.success).toBe(true);
      expect(body2.reply).toContain("₹150.00");
      expect(prisma.expense.create).toHaveBeenCalled();
    });
  });
});
