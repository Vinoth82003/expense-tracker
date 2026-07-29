"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";

// ──────────────── Types ────────────────

interface CacheEntry<T> {
  data: T;
  ts: number;
  ttl: number;
}

interface PendingPromise<T> {
  promise: Promise<T>;
  ts: number;
}

type Listener = () => void;

interface MutationOptions {
  url: string;
  method: string;
  body?: unknown;
  invalidate?: string[];
  toastMsg?: string;
}

// ──────────────── Constants ────────────────

const DEDUP_WINDOW = 5000;
const STALE_EVICT_INTERVAL = 120_000;

const TTL = {
  FAST: 10_000,
  DEFAULT: 30_000,
  SLOW: 60_000,
  CATEGORIES: 120_000,
} as const;

// ──────────────── Helpers ────────────────

export function cacheKey(...parts: string[]): string {
  return parts.join("::");
}

export function matchPrefix(key: string, prefix: string): boolean {
  return key === prefix || key.startsWith(prefix + "::");
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ──────────────── Cache Store ────────────────

class CacheStore {
  private map = new Map<string, CacheEntry<unknown>>();
  private listeners = new Set<Listener>();
  private pending = new Map<string, PendingPromise<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) {
      this.map.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number) {
    this.map.set(key, { data, ts: Date.now(), ttl });
    this.notify();
  }

  delete(key: string) {
    this.map.delete(key);
    this.notify();
  }

  deleteMatching(prefix: string) {
    this.map.forEach((_, key) => {
      if (matchPrefix(key, prefix)) this.map.delete(key);
    });
    this.notify();
  }

  clear() {
    this.map.clear();
    this.notify();
  }

  getPending<T>(key: string): Promise<T> | null {
    const p = this.pending.get(key);
    if (!p) return null;
    if (Date.now() - p.ts > DEDUP_WINDOW) {
      this.pending.delete(key);
      return null;
    }
    return p.promise as Promise<T>;
  }

  setPending<T>(key: string, promise: Promise<T>) {
    this.pending.set(key, { promise, ts: Date.now() });
  }

  deletePending(key: string) {
    this.pending.delete(key);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

// ──────────────── Context ────────────────

interface DataContextValue {
  cacheStore: CacheStore;
  fetchCached: <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => Promise<T>;
  invalidate: (key: string) => void;
  invalidateMatching: (prefix: string) => void;
  invalidateAll: () => void;
  mutate: (opts: MutationOptions) => Promise<unknown>;
  subscribe: (listener: Listener) => () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

// ──────────────── Provider ────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(new CacheStore());

  useEffect(() => {
    const interval = setInterval(() => {
      storeRef.current.clear();
    }, STALE_EVICT_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const fetchCached = useCallback(function <T>(
    this: unknown,
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = TTL.DEFAULT
  ): Promise<T> {
    const cached = storeRef.current.get<T>(key);
    if (cached !== null) return Promise.resolve(cached);

    const inflight = storeRef.current.getPending<T>(key);
    if (inflight !== null) return inflight;

    const promise = fetcher()
      .then((data) => {
        storeRef.current.set(key, data, ttl);
        storeRef.current.deletePending(key);
        return data;
      })
      .catch((err) => {
        storeRef.current.deletePending(key);
        throw err;
      });

    storeRef.current.setPending(key, promise);
    return promise;
  } as <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => Promise<T>, []);

  const invalidate = useCallback((key: string) => {
    storeRef.current.delete(key);
  }, []);

  const invalidateMatching = useCallback((prefix: string) => {
    storeRef.current.deleteMatching(prefix);
  }, []);

  const invalidateAll = useCallback(() => {
    storeRef.current.clear();
  }, []);

  const mutate = useCallback(async (opts: MutationOptions) => {
    const res = await fetch(opts.url, {
      method: opts.method,
      headers: { "Content-Type": "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await handleResponse(res);

    if (opts.invalidate) {
      opts.invalidate.forEach((key) => {
        if (key.endsWith("::*")) {
          storeRef.current.deleteMatching(key.slice(0, -3));
        } else {
          storeRef.current.delete(key);
        }
      });
    }

    return data;
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    return storeRef.current.subscribe(listener);
  }, []);

  return (
    <DataContext.Provider
      value={{
        cacheStore: storeRef.current,
        fetchCached,
        invalidate,
        invalidateMatching,
        invalidateAll,
        mutate,
        subscribe,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ──────────────── Hook ────────────────

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

// ──────────────── Domain Hooks ────────────────

type CurrencyData = { amount: number; category: string; subcategory: string; note: string | null; date: string }[];
type CategoryData = { id: string; name: string; type: string }[];

export function useExpenses(month: string) {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = cacheKey("expenses", "list", month);

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: CurrencyData | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<CurrencyData>(
      key,
      () => fetch(`/api/expenses?month=${month}`).then(handleResponse).then(r => r.expenses),
      TTL.DEFAULT
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [month, key, fetchCached]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached<CurrencyData>(
      key,
      () => fetch(`/api/expenses?month=${month}`).then(handleResponse).then(r => r.expenses),
      0
    );
  }, [key, month, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useIncome(month: string) {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = cacheKey("income", "list", month);

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: CurrencyData | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<CurrencyData>(
      key,
      () => fetch(`/api/income?month=${month}`).then(handleResponse).then(r => r.incomes),
      TTL.DEFAULT
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [month, key, fetchCached]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached<CurrencyData>(
      key,
      () => fetch(`/api/income?month=${month}`).then(handleResponse).then(r => r.incomes),
      0
    );
  }, [key, month, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useCategories() {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = "categories";

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: { globalCategories: CategoryData; userCategories: CategoryData } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<{ globalCategories: CategoryData; userCategories: CategoryData }>(
      key,
      () => fetch("/api/categories").then(handleResponse),
      TTL.CATEGORIES
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [key, fetchCached]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached(key, () => fetch("/api/categories").then(handleResponse), 0);
  }, [key, invalidate, fetchCached]);

  return { ...state, refetch };
}

type NotificationItem = { id: string; subject: string; body: string; createdAt: string; adminName: string; isRead: boolean };

export function useNotifications() {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = "notifications";

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: { notifications: NotificationItem[]; unreadCount: number } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<{ notifications: NotificationItem[]; unreadCount: number }>(
      key,
      () => fetch("/api/user/notifications").then(handleResponse),
      TTL.FAST
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [key, fetchCached]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached(key, () => fetch("/api/user/notifications").then(handleResponse), 0);
  }, [key, invalidate, fetchCached]);

  return { ...state, refetch };
}

type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    groupId: string;
    role: string;
    status: string;
    user: { id: string; name: string | null; email: string; avatar: string | null };
  }>;
  expenses?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    paidById: string;
    paidBy?: { id: string; name: string | null; avatar: string | null };
  }>;
};

export function useGroups() {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = "groups";

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: GroupItem[] | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<GroupItem[]>(
      key,
      () => fetch("/api/groups").then(handleResponse),
      TTL.SLOW
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => { cancelled = true; };
  }, [key, fetchCached]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached(key, () => fetch("/api/groups").then(handleResponse), 0);
  }, [key, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useGroup(id: string) {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = cacheKey("group", id);

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: GroupItem & { members: GroupItem["members"] } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<GroupItem & { members: GroupItem["members"] }>(
      key,
      () => fetch(`/api/groups/${id}`).then(handleResponse),
      TTL.SLOW
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => { cancelled = true; };
  }, [id, key, fetchCached]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached(key, () => fetch(`/api/groups/${id}`).then(handleResponse), 0);
  }, [key, id, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useSettings() {
  const { fetchCached, invalidate, subscribe, mutate } = useData();
  const key = "user-settings";

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, [subscribe]);

  const [state, setState] = useState<{
    data: { expenseMode: string; monthlyLimit: number } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<{ expenseMode: string; monthlyLimit: number }>(
      key,
      () => fetch("/api/user/settings").then(handleResponse),
      TTL.SLOW
    )
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [key, fetchCached]);

  const updateSettings = useCallback(
    async (settings: { expenseMode?: string; monthlyLimit?: number }) => {
      const result = await mutate({
        url: "/api/user/settings",
        method: "PATCH",
        body: settings,
        invalidate: [key],
      });
      return result;
    },
    [mutate]
  );

  return { ...state, refetch: () => { invalidate(key); }, updateSettings };
}

// ──────────────── Mutation helpers ────────────────

export function useMutations() {
  const { mutate, invalidateMatching } = useData();

  const afterWrite = useCallback(
    (prefixes: string[]) => {
      prefixes.forEach((p) => invalidateMatching(p));
    },
    [invalidateMatching]
  );

  const createExpense = useCallback(
    (data: { amount: number; category: string; subcategory: string; note?: string; date: string }) =>
      mutate({ url: "/api/expenses", method: "POST", body: data, invalidate: ["expenses::*", "budget::*"] }),
    [mutate]
  );

  const updateExpense = useCallback(
    (id: string, data: { amount?: number; category?: string; subcategory?: string; note?: string; date?: string }) =>
      mutate({ url: `/api/expenses/${id}`, method: "PATCH", body: data, invalidate: ["expenses::*", "budget::*"] }),
    [mutate]
  );

  const deleteExpense = useCallback(
    (id: string) =>
      mutate({ url: `/api/expenses/${id}`, method: "DELETE", invalidate: ["expenses::*", "budget::*"] }),
    [mutate]
  );

  const createIncome = useCallback(
    (data: { amount: number; source: string; note?: string; date: string }) =>
      mutate({ url: "/api/income", method: "POST", body: data, invalidate: ["income::*", "budget::*"] }),
    [mutate]
  );

  const updateIncome = useCallback(
    (id: string, data: { amount?: number; source?: string; note?: string; date?: string }) =>
      mutate({ url: `/api/income/${id}`, method: "PATCH", body: data, invalidate: ["income::*", "budget::*"] }),
    [mutate]
  );

  const deleteIncome = useCallback(
    (id: string) =>
      mutate({ url: `/api/income/${id}`, method: "DELETE", invalidate: ["income::*", "budget::*"] }),
    [mutate]
  );

  const createCategory = useCallback(
    (data: { name: string; type: string }) =>
      mutate({ url: "/api/categories", method: "POST", body: data, invalidate: ["categories"] }),
    [mutate]
  );

  const updateCategory = useCallback(
    (id: string, data: { name?: string; type?: string }) =>
      mutate({ url: `/api/categories/${id}`, method: "PATCH", body: data, invalidate: ["categories"] }),
    [mutate]
  );

  const deleteCategory = useCallback(
    (id: string) =>
      mutate({ url: `/api/categories/${id}`, method: "DELETE", invalidate: ["categories"] }),
    [mutate]
  );

  const markNotificationRead = useCallback(
    (id: string) =>
      mutate({ url: "/api/user/notifications/mark-read", method: "POST", body: { notificationId: id }, invalidate: ["notifications"] }),
    [mutate]
  );

  const markAllNotificationsRead = useCallback(
    (ids: string[]) =>
      mutate({ url: "/api/user/notifications/mark-read", method: "POST", body: { allIds: ids }, invalidate: ["notifications"] }),
    [mutate]
  );

  const deleteNotification = useCallback(
    (id: string) =>
      mutate({ url: `/api/user/notifications/${id}`, method: "DELETE", invalidate: ["notifications"] }),
    [mutate]
  );

  const createGroup = useCallback(
    (data: { name: string; description?: string }) =>
      mutate({ url: "/api/groups", method: "POST", body: data, invalidate: ["groups"] }),
    [mutate]
  );

  const updateGroup = useCallback(
    (id: string, data: { name?: string; description?: string }) =>
      mutate({ url: `/api/groups/${id}`, method: "PUT", body: data, invalidate: [cacheKey("group", id), "groups"] }),
    [mutate]
  );

  const deleteGroup = useCallback(
    (id: string) =>
      mutate({ url: `/api/groups/${id}`, method: "DELETE", invalidate: ["groups", cacheKey("group", id)] }),
    [mutate]
  );

  const removeGroupMember = useCallback(
    (groupId: string, userId: string) =>
      mutate({ url: `/api/groups/${groupId}/members/${userId}`, method: "DELETE", invalidate: [cacheKey("group", groupId), "groups"] }),
    [mutate]
  );

  return {
    afterWrite,
    createExpense,
    updateExpense,
    deleteExpense,
    createIncome,
    updateIncome,
    deleteIncome,
    createCategory,
    updateCategory,
    deleteCategory,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    createGroup,
    updateGroup,
    deleteGroup,
    removeGroupMember,
  };
}
