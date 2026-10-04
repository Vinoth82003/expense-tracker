"use client";

import { Sparkles, User } from "lucide-react";
import {
  getEntrySourceLabel,
  normalizeEntrySource,
} from "@/lib/transaction-source";

interface EntrySourceBadgeProps {
  value?: string | null;
  /** Hide the label and show only the icon. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Renders the "By you" / "By Sage" provenance tag on a transaction.
 *
 * Values are normalised first, so a row written before `entrySource` existed —
 * or one with a value we don't recognise — still renders a valid "By you" badge
 * instead of an empty chip.
 */
export default function EntrySourceBadge({
  value,
  iconOnly = false,
  className = "",
}: EntrySourceBadgeProps) {
  const source = normalizeEntrySource(value);
  const isSage = source === "SAGE";
  const label = getEntrySourceLabel(source);
  const Icon = isSage ? Sparkles : User;

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap ${
        isSage
          ? "bg-tertiary-500/10 text-tertiary-500"
          : "bg-surface-variant text-muted"
      } ${className}`}
    >
      <Icon size={9} strokeWidth={2.5} />
      {!iconOnly && label}
    </span>
  );
}