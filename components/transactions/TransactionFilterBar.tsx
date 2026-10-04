"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  EMPTY_FILTERS,
  countActiveFilters,
  isFilterActive,
  type TransactionFilters,
} from "@/lib/transaction-grouping";
import { ENTRY_SOURCE_LABELS, normalizeEntrySource } from "@/lib/transaction-source";

export interface TransactionFacets {
  categories: string[];
  subcategories: string[];
  sources: string[];
  entrySources: string[];
}

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  onChange: (next: TransactionFilters) => void;
  facets: TransactionFacets;
  kind: "expense" | "income";
  /** Extra controls rendered on the right of the search row (e.g. Add button). */
  actions?: React.ReactNode;
  resultCount: number;
}

const chip =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors";

/** A dropdown that supports selecting several values at once. */
function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  formatOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  formatOption?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (options.length === 0) return null;

  const fmt = formatOption ?? ((v: string) => v);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${chip} border ${
          selected.length
            ? "border-primary-500/40 bg-primary-500/10 text-primary-500"
            : "border-border-subtle bg-surface text-muted hover:text-foreground"
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-md bg-primary-500 px-1.5 py-0.5 text-[10px] text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-1.5 shadow-xl"
        >
          {options.map((opt) => {
            const isOn = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={isOn}
                onClick={() => onToggle(opt)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  isOn
                    ? "bg-primary-500/10 text-primary-500"
                    : "text-muted hover:bg-surface-variant hover:text-foreground"
                }`}
              >
                <span className="truncate">{fmt(opt)}</span>
                {isOn && <Check size={13} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function TransactionFilterBar({
  filters,
  onChange,
  facets,
  kind,
  actions,
  resultCount,
}: TransactionFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeCount = countActiveFilters(filters);
  const active = isFilterActive(filters);

  const set = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => onChange({ ...filters, [key]: value });

  const sourceLabel = (v: string) =>
    kind === "income" ? v : ENTRY_SOURCE_LABELS[normalizeEntrySource(v)];

  return (
    <div className="space-y-2.5">
      {/* Search + actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search transactions…"
            aria-label="Search transactions"
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary-500"
          />
        </div>
        {actions}
      </div>

      {/* Facet chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {kind === "expense" && (
          <MultiSelect
            label="Category"
            options={facets.categories}
            selected={filters.categories}
            onToggle={(v) => set("categories", toggleIn(filters.categories, v))}
          />
        )}

        <MultiSelect
          label={kind === "income" ? "Income source" : "Entered by"}
          options={kind === "income" ? facets.sources : facets.entrySources}
          selected={kind === "income" ? filters.sources : filters.entrySources}
          onToggle={(v) =>
            kind === "income"
              ? set("sources", toggleIn(filters.sources, v))
              : set("entrySources", toggleIn(filters.entrySources, v))
          }
          formatOption={sourceLabel}
        />

        {kind === "expense" && (
          <MultiSelect
            label="Subcategory"
            options={facets.subcategories}
            selected={filters.subcategories}
            onToggle={(v) => set("subcategories", toggleIn(filters.subcategories, v))}
          />
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          aria-expanded={showAdvanced}
          className={`${chip} border ${
            filters.minAmount !== undefined ||
            filters.maxAmount !== undefined ||
            filters.fromDate ||
            filters.toDate
              ? "border-primary-500/40 bg-primary-500/10 text-primary-500"
              : "border-border-subtle bg-surface text-muted hover:text-foreground"
          }`}
        >
          <SlidersHorizontal size={13} />
          More
        </button>

        {active && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            className={`${chip} border border-border-subtle bg-surface text-muted hover:text-error hover:border-error/40`}
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}

        <span className="ml-auto text-[11px] text-muted tabular-nums">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Advanced panel */}
      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-border-subtle bg-surface p-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Min amount
            </span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={filters.minAmount ?? ""}
              onChange={(e) =>
                set("minAmount", e.target.value === "" ? undefined : Number(e.target.value))
              }
              placeholder="0"
              className="w-full rounded-lg border border-border-subtle bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Max amount
            </span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={filters.maxAmount ?? ""}
              onChange={(e) =>
                set("maxAmount", e.target.value === "" ? undefined : Number(e.target.value))
              }
              placeholder="Any"
              className="w-full rounded-lg border border-border-subtle bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              From date
            </span>
            <input
              type="date"
              value={filters.fromDate ?? ""}
              onChange={(e) => set("fromDate", e.target.value || undefined)}
              className="w-full rounded-lg border border-border-subtle bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              To date
            </span>
            <input
              type="date"
              value={filters.toDate ?? ""}
              onChange={(e) => set("toDate", e.target.value || undefined)}
              className="w-full rounded-lg border border-border-subtle bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary-500"
            />
          </label>

          {active && (
            <button
              type="button"
              onClick={() => onChange({ ...EMPTY_FILTERS })}
              className="col-span-2 sm:col-span-4 flex items-center justify-center gap-1.5 rounded-lg border border-border-subtle py-2 text-xs font-semibold text-muted transition-colors hover:text-error"
            >
              <X size={12} /> Reset all filters
            </button>
          )}
        </div>
      )}

      {active && !showAdvanced && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <Filter size={11} />
          {activeCount} filter{activeCount === 1 ? "" : "s"} active
        </div>
      )}
    </div>
  );
}