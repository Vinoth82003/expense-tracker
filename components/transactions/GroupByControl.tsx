"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LayoutList } from "lucide-react";
import type { GroupKey } from "@/lib/transaction-grouping";

interface GroupByControlProps {
  value: GroupKey;
  options: { value: GroupKey; label: string }[];
  onChange: (next: GroupKey) => void;
  /** Number of groups the current selection produces. */
  groupCount: number;
}

export default function GroupByControl({
  value,
  options,
  onChange,
  groupCount,
}: GroupByControlProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Group by ${current?.label ?? value}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-foreground"
      >
        <LayoutList size={13} />
        <span className="text-foreground">{current?.label ?? value}</span>
        <span className="text-muted">· {groupCount}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-1.5 w-48 rounded-xl border border-border-subtle bg-surface p-1.5 shadow-xl"
        >
          {options.map((opt) => {
            const isOn = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isOn}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  isOn
                    ? "bg-primary-500/10 text-primary-500"
                    : "text-muted hover:bg-surface-variant hover:text-foreground"
                }`}
              >
                Group by {opt.label}
                {isOn && <Check size={13} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}