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

/**
 * Cache subscribers are notified when a cache entry is INVALIDATED, and receive
 * the invalidated key (or prefix, or "*" for a full flush). They are NOT notified
 * when an entry is written — otherwise a subscriber would re-trigger the very
 * fetch that produced the write.
 */
type Listener = (prefix: string) => void;

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

/**
 * Canonical list keys. The dashboard store and the per-page domain hooks must
 * agree on these, otherwise the same month is fetched (and cached) twice.
 * Values are the full API envelope, e.g. { expenses: [...] }.
 */
export const expenseListKey = (month: string) => cacheKey("expenses", month);
export const incomeListKey = (month: string) => cacheKey("income", month);

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

export class CacheStore {
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
  }

  delete(key: string) {
    this.map.delete(key);
    this.notify(key);
  }

  deleteMatching(prefix: string) {
    this.map.forEach((_, key) => {
      if (matchPrefix(key, prefix)) this.map.delete(key);
    });
    this.notify(prefix);
  }

  clear() {
    this.map.clear();
    this.notify("*");
  }

  /**
   * Memory hygiene only: evicts expired entries WITHOUT notifying subscribers.
   * An eviction is not a data change, so mounted consumers must not refetch
   * because of it — they revalidate on their own TTL when they next fetch.
   */
  sweep() {
    const now = Date.now();
    this.map.forEach((entry, key) => {
      if (now - entry.ts > entry.ttl) this.map.delete(key);
    });
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

  private notify(prefix: string) {
    this.listeners.forEach((fn) => fn(prefix));
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
      storeRef.current.sweep();
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

type CurrencyData = { id?: string; amount: number; category: string; subcategory: string; note: string | null; date: string }[];
type CategoryData = { id: string; name: string; type: string }[];

/**
 * Returns a counter that increments whenever the cache entry for `key` (or any
 * prefix covering it) is invalidated. Include it in a fetching effect's
 * dependency list so mounted consumers refetch immediately after a write
 * performed elsewhere (e.g. UserContext optimistic updates from chat/Sage).
 */
function useCacheRefresh(key: string, subscribe: DataContextValue["subscribe"]): number {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    return subscribe((prefix) => {
      if (prefix === "*" || matchPrefix(key, prefix)) {
        setRefresh((r) => r + 1);
      }
    });
  }, [subscribe, key]);

  return refresh;
}

export function useExpenses(month: string) {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = expenseListKey(month);

  const [state, setState] = useState<{
    data: CurrencyData | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const refresh = useCacheRefresh(key, subscribe);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<{ expenses: CurrencyData }>(
      key,
      () => fetch(`/api/expenses?month=${month}`).then(handleResponse),
      TTL.DEFAULT
    )
      .then((d) => {
        if (!cancelled) setState({ data: d.expenses ?? [], loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [month, key, fetchCached, refresh]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached<{ expenses: CurrencyData }>(
      key,
      () => fetch(`/api/expenses?month=${month}`).then(handleResponse),
      0
    ).then((d) => d.expenses ?? []);
  }, [key, month, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useIncome(month: string) {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = incomeListKey(month);

  const [state, setState] = useState<{
    data: CurrencyData | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const refresh = useCacheRefresh(key, subscribe);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCached<{ incomes: CurrencyData }>(
      key,
      () => fetch(`/api/income?month=${month}`).then(handleResponse),
      TTL.DEFAULT
    )
      .then((d) => {
        if (!cancelled) setState({ data: d.incomes ?? [], loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [month, key, fetchCached, refresh]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached<{ incomes: CurrencyData }>(
      key,
      () => fetch(`/api/income?month=${month}`).then(handleResponse),
      0
    ).then((d) => d.incomes ?? []);
  }, [key, month, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useCategories() {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = "categories";
  const refresh = useCacheRefresh(key, subscribe);

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
  }, [key, fetchCached, refresh]);

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
  const refresh = useCacheRefresh(key, subscribe);

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
  }, [key, fetchCached, refresh]);

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
  const refresh = useCacheRefresh(key, subscribe);

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
  }, [key, fetchCached, refresh]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached(key, () => fetch("/api/groups").then(handleResponse), 0);
  }, [key, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useGroup(id: string) {
  const { fetchCached, invalidate, subscribe } = useData();
  const key = cacheKey("group", id);
  const refresh = useCacheRefresh(key, subscribe);

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
  }, [id, key, fetchCached, refresh]);

  const refetch = useCallback(() => {
    invalidate(key);
    return fetchCached(key, () => fetch(`/api/groups/${id}`).then(handleResponse), 0);
  }, [key, id, invalidate, fetchCached]);

  return { ...state, refetch };
}

export function useSettings() {
  const { fetchCached, invalidate, subscribe, mutate } = useData();
  const key = "user-settings";
  const refresh = useCacheRefresh(key, subscribe);

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
  }, [key, fetchCached, refresh]);

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
