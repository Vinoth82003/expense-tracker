"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useData, expenseListKey, incomeListKey } from "./DataContext";
import {
  mergeById,
  monthKeyOf,
  normalizeSyncPayload,
  splitByMonth,
  SYNC_EVENTS,
} from "@/lib/chat/batchSync";

/** next-auth's session user type does not carry expenseMode. */
type SessionUser = { expenseMode?: string } & Record<string, unknown>;

export interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
  note: string | null;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  note: string | null;
}

export type ExpenseInput = {
  amount: number;
  category: string;
  subcategory: string;
  note?: string;
  date: string;
};

export type IncomeInput = {
  amount: number;
  source: string;
  note?: string;
  date: string;
};

interface UserContextValue {
  expenses: Expense[];
  incomes: Income[];
  prevExpenses: Expense[];
  prevIncomes: Income[];
  monthlyLimit: number;
  expenseMode: string;
  loading: boolean;
  isTogglingMode: boolean;
  stats: {
    totalSpent: number;
    totalIncome: number;
    netBalance: number;
    dailyAverage: number;
    remaining: number;
  };
  refreshData: () => Promise<void>;
  toggleExpenseMode: () => Promise<void>;
  updateBudget: (limit: number, mode?: string) => Promise<void>;

  // Optimistic writes: local state updates immediately, the request follows,
  // and a failure restores the previous snapshot before rethrowing.
  addExpense: (data: ExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (data: IncomeInput) => Promise<Income>;
  updateIncome: (id: string, data: Partial<IncomeInput>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const byDateDesc = (a: Expense | Income, b: Expense | Income) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

let tempIdCounter = 0;
const tempId = () => `tmp_${Date.now()}_${tempIdCounter++}`;

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { fetchCached, invalidateMatching } = useData();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
  const [prevIncomes, setPrevIncomes] = useState<Income[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [expenseMode, setExpenseMode] = useState("no-limit");
  const [loading, setLoading] = useState(true);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  // Snapshots for rollback, kept in a ref so the mutation callbacks stay stable.
  const snapshot = useRef<{
    expenses: Expense[];
    incomes: Income[];
    prevExpenses: Expense[];
    prevIncomes: Income[];
  }>({ expenses: [], incomes: [], prevExpenses: [], prevIncomes: [] });

  const stats = React.useMemo(() => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const netBalance = totalIncome - totalSpent;
    const remaining = monthlyLimit - totalSpent;
    const currentDay = new Date().getDate();
    const dailyAverage = totalSpent / (currentDay || 1);
    return { totalSpent, totalIncome, netBalance, dailyAverage, remaining };
  }, [expenses, incomes, monthlyLimit]);

  /**
   * Reads this month + last month and the monthly budget.
   *
   * `bypassCache` exists because the list reads go through `fetchCached`, which
   * returns a still-warm entry (30s TTL) instead of hitting the network. That
   * is right for the mount-time load and wrong for a recovery re-read after a
   * write: it would hand back the exact pre-write snapshot the caller is trying
   * to replace, so a "refresh" would look like it succeeded while changing
   * nothing. Anything that must observe the latest server state asks for it.
   */
  const fetchData = useCallback(
    async (opts?: { bypassCache?: boolean }) => {
      if (!session) return;

      if (opts?.bypassCache) {
        // Invalidated before the reads below, which is what makes them miss.
        invalidateMatching("expenses");
        invalidateMatching("income");
      }

      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

        const [expData, incData, budgetData, prevExpData, prevIncData] = await Promise.all([
          fetchCached<{ expenses: Expense[] }>(
            expenseListKey(month),
            () => fetch(`/api/expenses?month=${month}`).then((r) => r.json()),
          ),
          fetchCached<{ incomes: Income[] }>(
            incomeListKey(month),
            () => fetch(`/api/income?month=${month}`).then((r) => r.json()),
          ),
          fetch(`/api/budget?month=${month}`).then((r) => r.json()),
          fetchCached<{ expenses: Expense[] }>(
            expenseListKey(prevMonth),
            () => fetch(`/api/expenses?month=${prevMonth}`).then((r) => r.json()),
          ),
          fetchCached<{ incomes: Income[] }>(
            incomeListKey(prevMonth),
            () => fetch(`/api/income?month=${prevMonth}`).then((r) => r.json()),
          ),
        ]);

        const nextExpenses = expData.expenses || [];
        const nextIncomes = incData.incomes || [];
        const nextPrevExpenses = prevExpData.expenses || [];
        const nextPrevIncomes = prevIncData.incomes || [];

        snapshot.current = {
          expenses: nextExpenses,
          incomes: nextIncomes,
          prevExpenses: nextPrevExpenses,
          prevIncomes: nextPrevIncomes,
        };

        setExpenses(nextExpenses);
        setIncomes(nextIncomes);
        setPrevExpenses(nextPrevExpenses);
        setPrevIncomes(nextPrevIncomes);
        setMonthlyLimit(budgetData.limit || 0);

        if (session.user) {
          setExpenseMode(
            (session.user as SessionUser).expenseMode || "no-limit",
          );
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    },
    [session, fetchCached, invalidateMatching]
  );

  useEffect(() => {
    if (!session) return;
    fetchData();

    // Batch merge: folds a whole list in with one state update per month
    // bucket instead of one update per record, dropping duplicates by id.
    // Returns whether anything actually landed, so the caller can tell a
    // genuine no-op from a record that fell outside the tracked two months.
    const insertMany = <T extends Expense | Income>(
      items: readonly Record<string, unknown>[] | undefined,
      setList: React.Dispatch<React.SetStateAction<T[]>>,
      setPrevList: React.Dispatch<React.SetStateAction<T[]>>,
    ): boolean => {
      if (!Array.isArray(items) || items.length === 0) return false;
      const typed = items as unknown as T[];
      const { current, previous } = splitByMonth(typed);
      if (current.length) setList((prevList) => mergeById(prevList, current));
      if (previous.length) setPrevList((prevList) => mergeById(prevList, previous));
      return current.length > 0 || previous.length > 0;
    };

    /**
     * Recovery path for a payload we cannot apply: drop every cached list and
     * re-read. `fetchData` performs the invalidation itself, and it has to happen
     * before its own reads — the reverse order silently returns the warm
     * pre-write snapshot.
     */
    const refetchFromServer = () => {
      void fetchData({ bypassCache: true });
    };

    /**
     * Single entry point for every chat/Sage write event.
     *
     * The event name alone does not describe the payload — the batch executor
     * emits `expenseAdded`/`incomeAdded`/`budgetUpdated` while still sending the
     * full `{ expenses[], incomes[], budget }` envelope, and the older paths send
     * the bare row under the same names. Each handler used to assume its own
     * shape, so a single-expense Sage message merged nothing and the write only
     * surfaced via a cache-invalidated re-fetch — the visible "lag".
     * `normalizeSyncPayload` collapses all shapes, so a write lands in local
     * state in the same tick it is dispatched, exactly like a manual add.
     */
    const applySync = (e: Event) => {
      const sync = normalizeSyncPayload(e.type, (e as CustomEvent).detail);

      if (!sync) {
        // Nothing usable in the payload — re-read rather than sit on stale state.
        refetchFromServer();
        return;
      }

      const landed =
        insertMany(sync.expenses, setExpenses, setPrevExpenses) ||
        insertMany(sync.incomes, setIncomes, setPrevIncomes);

      if (sync.budgetAmount !== undefined) {
        setMonthlyLimit(sync.budgetAmount);
        // A budget write always implies the limit is being enforced; only an
        // explicit mode in the payload may say otherwise.
        setExpenseMode(sync.expenseMode ?? "limit");
      }

      // The merges above only patch this context's local lists. The list pages
      // read DataContext's cache, so every bucket the write touched must drop
      // its cached copy or they keep rendering the pre-write snapshot.
      if (sync.expenses.length) invalidateMatching("expenses");
      if (sync.incomes.length) invalidateMatching("income");
      if (sync.budgetAmount !== undefined) invalidateMatching("budget");

      // Records can arrive dated outside the two months this context tracks (or
      // with an unparseable date). Nothing landed, so a re-read is the only way
      // those become visible.
      if (!landed && sync.budgetAmount === undefined) refetchFromServer();
    };

    const listeners = SYNC_EVENTS.map((name) => {
      const handler = (e: Event) => applySync(e);
      window.addEventListener(name, handler);
      return [name, handler] as const;
    });

    return () => {
      for (const [name, handler] of listeners) {
        window.removeEventListener(name, handler);
      }
    };
  }, [session, fetchData, invalidateMatching]);

  const restore = useCallback(() => {
    setExpenses(snapshot.current.expenses);
    setIncomes(snapshot.current.incomes);
    setPrevExpenses(snapshot.current.prevExpenses);
    setPrevIncomes(snapshot.current.prevIncomes);
  }, []);

  const applyToMonth = useCallback(
    (
      kind: "expenses" | "incomes",
      date: string,
      apply: (list: Array<Expense | Income>) => Array<Expense | Income>,
    ) => {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
      const target = monthKeyOf(date);

      if (target === month) {
        if (kind === "expenses") {
          setExpenses((list) => apply(list) as Expense[]);
        } else {
          setIncomes((list) => apply(list) as Income[]);
        }
      } else if (target === prevMonth) {
        if (kind === "expenses") {
          setPrevExpenses((list) => apply(list) as Expense[]);
        } else {
          setPrevIncomes((list) => apply(list) as Income[]);
        }
      }
    },
    [],
  );

  const addExpense = useCallback(
    async (data: ExpenseInput) => {
      const optimistic: Expense = {
        id: tempId(),
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory,
        date: data.date,
        note: data.note ?? null,
      };

      applyToMonth("expenses", data.date, (list) =>
        [optimistic, ...list].sort((a, b) => byDateDesc(a, b)),
      );

      try {
        const res = await request<{ expense: Expense }>("/api/expenses", "POST", data);
        const saved = res.expense;
        applyToMonth("expenses", saved.date ?? data.date, (list) =>
          list.map((e) => ((e as Expense).id === optimistic.id ? saved : e)),
        );
        invalidateMatching("expenses");
        invalidateMatching("budget");
        return saved;
      } catch (error) {
        restore();
        throw error;
      }
    },
    [applyToMonth, invalidateMatching, restore],
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<ExpenseInput>) => {
      const before = snapshot.current.expenses.find((e) => e.id === id);

      applyToMonth("expenses", data.date ?? before?.date ?? new Date().toISOString(), (list) =>
        list.map((e) =>
          e.id === id
            ? {
                ...(e as Expense),
                ...data,
                amount: data.amount ?? (e as Expense).amount,
                category: data.category ?? (e as Expense).category,
                subcategory: data.subcategory ?? (e as Expense).subcategory,
                note: data.note ?? (e as Expense).note,
              }
            : e,
        ),
      );

      try {
        const res = await request<{ expense: Expense }>(`/api/expenses/${id}`, "PATCH", data);
        const saved = res.expense;
        applyToMonth("expenses", saved.date ?? before?.date ?? data.date ?? "", (list) =>
          list.map((e) => (e.id === id ? saved : e)),
        );
        invalidateMatching("expenses");
        invalidateMatching("budget");
      } catch (error) {
        restore();
        throw error;
      }
    },
    [applyToMonth, invalidateMatching, restore],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const before = snapshot.current.expenses.find((e) => e.id === id);
      applyToMonth("expenses", before?.date ?? new Date().toISOString(), (list) =>
        list.filter((e) => e.id !== id),
      );

      try {
        await request(`/api/expenses/${id}`, "DELETE");
        invalidateMatching("expenses");
        invalidateMatching("budget");
      } catch (error) {
        restore();
        throw error;
      }
    },
    [applyToMonth, invalidateMatching, restore],
  );

  const addIncome = useCallback(
    async (data: IncomeInput) => {
      const optimistic: Income = {
        id: tempId(),
        amount: data.amount,
        source: data.source,
        date: data.date,
        note: data.note ?? null,
      };

      applyToMonth("incomes", data.date, (list) =>
        [optimistic, ...list].sort((a, b) => byDateDesc(a, b)),
      );

      try {
        const res = await request<{ income: Income }>("/api/income", "POST", data);
        const saved = res.income;
        applyToMonth("incomes", saved.date ?? data.date, (list) =>
          list.map((i) => ((i as Income).id === optimistic.id ? saved : i)),
        );
        invalidateMatching("income");
        invalidateMatching("budget");
        return saved;
      } catch (error) {
        restore();
        throw error;
      }
    },
    [applyToMonth, invalidateMatching, restore],
  );

  const updateIncome = useCallback(
    async (id: string, data: Partial<IncomeInput>) => {
      const before = snapshot.current.incomes.find((i) => i.id === id);

      applyToMonth("incomes", data.date ?? before?.date ?? new Date().toISOString(), (list) =>
        list.map((i) =>
          i.id === id
            ? {
                ...(i as Income),
                ...data,
                amount: data.amount ?? (i as Income).amount,
                source: data.source ?? (i as Income).source,
                note: data.note ?? (i as Income).note,
              }
            : i,
        ),
      );

      try {
        const res = await request<{ income: Income }>(`/api/income/${id}`, "PATCH", data);
        const saved = res.income;
        applyToMonth("incomes", saved.date ?? before?.date ?? data.date ?? "", (list) =>
          list.map((i) => (i.id === id ? saved : i)),
        );
        invalidateMatching("income");
        invalidateMatching("budget");
      } catch (error) {
        restore();
        throw error;
      }
    },
    [applyToMonth, invalidateMatching, restore],
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      const before = snapshot.current.incomes.find((i) => i.id === id);
      applyToMonth("incomes", before?.date ?? new Date().toISOString(), (list) =>
        list.filter((i) => i.id !== id),
      );

      try {
        await request(`/api/income/${id}`, "DELETE");
        invalidateMatching("income");
        invalidateMatching("budget");
      } catch (error) {
        restore();
        throw error;
      }
    },
    [applyToMonth, invalidateMatching, restore],
  );

  const toggleExpenseMode = useCallback(async () => {
    if (isTogglingMode) return;
    setIsTogglingMode(true);
    const newMode = expenseMode === "limit" ? "no-limit" : "limit";
    try {
      const res = await fetch("/api/user/expense-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseMode: newMode }),
      });
      if (res.ok) {
        setExpenseMode(newMode);
        if (session?.user) {
          (session.user as SessionUser).expenseMode = newMode;
        }
      }
    } catch (error) {
      console.error("Failed to toggle expense mode:", error);
    } finally {
      setIsTogglingMode(false);
    }
  }, [expenseMode, isTogglingMode, session]);

  const updateBudget = useCallback(
    async (limit: number, mode?: string) => {
      const before = { limit: monthlyLimit, mode: expenseMode };
      setMonthlyLimit(limit);
      if (mode) setExpenseMode(mode);

      try {
        await request("/api/user/settings", "PATCH", {
          monthlyLimit: limit,
          ...(mode ? { expenseMode: mode } : {}),
        });
        invalidateMatching("budget");
      } catch (error) {
        setMonthlyLimit(before.limit);
        setExpenseMode(before.mode);
        throw error;
      }
    },
    [monthlyLimit, expenseMode, invalidateMatching],
  );

  const value: UserContextValue = {
    expenses,
    incomes,
    prevExpenses,
    prevIncomes,
    monthlyLimit,
    expenseMode,
    loading,
    isTogglingMode,
    stats,
    // A user-initiated refresh must always observe the server, never the cache.
    refreshData: () => fetchData({ bypassCache: true }),
    toggleExpenseMode,
    updateBudget,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (ctx === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}