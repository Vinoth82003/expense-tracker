/**
 * Pure grouping + filtering logic shared by the expense and income pages.
 *
 * Kept free of React and of any single page's data shape so both transaction
 * pages can share it and so the behaviour can be unit-tested directly.
 */

import { getEntrySourceLabel, normalizeEntrySource } from "./transaction-source";

export type GroupKey = "date" | "category" | "source" | "subcategory";

export const GROUP_OPTIONS: { value: GroupKey; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "category", label: "Category" },
  { value: "source", label: "Source" },
  { value: "subcategory", label: "Subcategory" },
];

export interface TransactionLike {
  id: string;
  amount: number;
  note?: string | null;
  date: string;
  /** "MANUAL" | "SAGE"; absent on rows written before the field existed. */
  entrySource?: string | null;
  category?: string;
  subcategory?: string;
  /** Income origin, e.g. "Salary". */
  source?: string;
}

export interface TransactionGroup<T = TransactionLike> {
  key: string;
  label: string;
  /** Sort weight: dates and amounts sort naturally, text falls back to alpha. */
  sortValue: string | number;
  items: T[];
  total: number;
  count: number;
}

export interface TransactionFilters {
  search: string;
  categories: string[];
  subcategories: string[];
  sources: string[];
  entrySources: string[];
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
}

export const EMPTY_FILTERS: TransactionFilters = {
  search: "",
  categories: [],
  subcategories: [],
  sources: [],
  entrySources: [],
  minAmount: undefined,
  maxAmount: undefined,
  fromDate: undefined,
  toDate: undefined,
};

export const isFilterActive = (f: TransactionFilters): boolean =>
  f.search.trim() !== "" ||
  f.categories.length > 0 ||
  f.subcategories.length > 0 ||
  f.sources.length > 0 ||
  f.entrySources.length > 0 ||
  f.minAmount !== undefined ||
  f.maxAmount !== undefined ||
  f.fromDate !== undefined ||
  f.toDate !== undefined;

export const countActiveFilters = (f: TransactionFilters): number => {
  let n = 0;
  if (f.search.trim()) n++;
  n += f.categories.length;
  n += f.subcategories.length;
  n += f.sources.length;
  n += f.entrySources.length;
  if (f.minAmount !== undefined || f.maxAmount !== undefined) n++;
  if (f.fromDate !== undefined || f.toDate !== undefined) n++;
  return n;
};

/** yyyy-mm-dd in local time — avoids the UTC shift of toISOString(). */
export const toDayKey = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const formatDayLabel = (dayKey: string): string => {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return dayKey;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

/**
 * Which grouping a page should offer. Income has no category/subcategory, so
 * offering them there would produce meaningless groups; expenses have no income
 * "source" column, so their source axis is the provenance tag instead.
 */
export const groupOptionsFor = (kind: "expense" | "income") =>
  kind === "expense"
    ? GROUP_OPTIONS
    : GROUP_OPTIONS.filter((o) => o.value !== "category" && o.value !== "subcategory");

const groupMeta = (
  item: TransactionLike,
  by: GroupKey,
  kind: "expense" | "income"
): { key: string; label: string; sortValue: string | number } => {
  switch (by) {
    case "date": {
      const key = toDayKey(item.date);
      return { key, label: formatDayLabel(key), sortValue: key };
    }
    case "category": {
      const label = item.category || "Uncategorised";
      return { key: label, label, sortValue: label };
    }
    case "subcategory": {
      const label = item.subcategory || "Uncategorised";
      return { key: label, label, sortValue: label };
    }
    case "source": {
      // On income "source" is the income origin; on expenses the meaningful
      // "source" axis is who entered it.
      if (kind === "income") {
        const label = item.source || "Other";
        return { key: label, label, sortValue: label };
      }
      const label = getEntrySourceLabel(item.entrySource);
      return { key: label, label, sortValue: label };
    }
  }
};

export const groupTransactions = <T extends TransactionLike>(
  items: T[],
  by: GroupKey,
  kind: "expense" | "income"
): TransactionGroup<T>[] => {
  const map = new Map<string, TransactionGroup<T>>();

  for (const item of items) {
    const meta = groupMeta(item, by, kind);
    // Guard against a malformed date producing a shared empty bucket.
    const key = meta.key === "" ? "undated" : meta.key;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
      existing.total += item.amount;
      existing.count += 1;
    } else {
      map.set(key, {
        key,
        label: meta.label,
        sortValue: meta.sortValue,
        items: [item],
        total: item.amount,
        count: 1,
      });
    }
  }

  const groups = Array.from(map.values());

  // Date buckets read best newest-first; every other axis is alphabetical so
  // the order is predictable between renders.
  groups.sort((a, b) =>
    by === "date"
      ? String(b.sortValue).localeCompare(String(a.sortValue))
      : String(a.sortValue).localeCompare(String(b.sortValue))
  );

  return groups;
};

export const applyFilters = <T extends TransactionLike>(
  items: T[],
  f: TransactionFilters
): T[] => {
  const needle = f.search.trim().toLowerCase();

  return items.filter((item) => {
    if (needle) {
      const haystack = [
        item.note,
        item.category,
        item.subcategory,
        item.source,
        String(item.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    if (f.categories.length && !f.categories.includes(item.category || "")) {
      return false;
    }
    if (
      f.subcategories.length &&
      !f.subcategories.includes(item.subcategory || "")
    ) {
      return false;
    }
    if (f.sources.length && !f.sources.includes(item.source || "")) {
      return false;
    }
    if (
      f.entrySources.length &&
      !f.entrySources.includes(normalizeEntrySource(item.entrySource))
    ) {
      return false;
    }

    if (f.minAmount !== undefined && item.amount < f.minAmount) return false;
    if (f.maxAmount !== undefined && item.amount > f.maxAmount) return false;

    // Compare on the day only: a date input yields yyyy-mm-dd, and an expense
    // made at 18:00 on the end date must not be excluded by a midnight bound.
    const day = toDayKey(item.date);
    if (f.fromDate && day && day < f.fromDate) return false;
    if (f.toDate && day && day > f.toDate) return false;

    return true;
  });
};

/** Distinct values present in the data, for populating filter dropdowns. */
export const collectFacets = (items: TransactionLike[]) => {
  const categories = new Set<string>();
  const subcategories = new Set<string>();
  const sources = new Set<string>();
  const entrySources = new Set<string>();

  for (const item of items) {
    if (item.category) categories.add(item.category);
    if (item.subcategory) subcategories.add(item.subcategory);
    if (item.source) sources.add(item.source);
    entrySources.add(normalizeEntrySource(item.entrySource));
  }

  const sorted = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));

  return {
    categories: sorted(categories),
    subcategories: sorted(subcategories),
    sources: sorted(sources),
    entrySources: sorted(entrySources),
  };
};

export const sumAmount = (items: TransactionLike[]): number =>
  items.reduce((total, i) => total + i.amount, 0);