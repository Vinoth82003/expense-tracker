"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleGroupProps {
  /** Stable identity for the group; also seeds the region id. */
  groupKey: string;
  /** Human label for the group, e.g. "Needs" or "15 Oct". */
  label: string;
  /** Pre-formatted group total, e.g. "₹1,240". */
  totalLabel: string;
  /** Pre-formatted member count, e.g. "4 items". */
  countLabel: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * A disclosure group for one slice of the transaction list.
 *
 * Built on the native disclosure pattern rather than an accordion: every header
 * is a real `<button>` carrying `aria-expanded` + `aria-controls`, and the
 * panel is a `region` labelled by that header. Screen-reader users can therefore
 * list every group and its state without entering it, and each header is in the
 * tab order on its own — which is what makes a long grouped list navigable.
 *
 * The collapse animation is skipped entirely under `prefers-reduced-motion`; the
 * state change still happens, it just doesn't animate.
 */
export default function CollapsibleGroup({
  groupKey,
  label,
  totalLabel,
  countLabel,
  expanded,
  onToggle,
  children,
  className,
}: CollapsibleGroupProps) {
  const reduceMotion = useReducedMotion();
  const headerId = `grp-${groupKey}-header`;
  const panelId = `grp-${groupKey}-panel`;

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border-subtle bg-surface", className)}>
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
            "hover:bg-surface-variant/50 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
          )}
        >
          <motion.span
            aria-hidden="true"
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
            className="flex-shrink-0 text-muted"
          >
            <ChevronDown size={16} />
          </motion.span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
            <span className="mt-0.5 block text-[11px] font-medium text-muted">{countLabel}</span>
          </span>

          <span className="flex-shrink-0 text-sm font-bold tabular-nums text-foreground">
            {totalLabel}
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.15 } }
            }
            className="overflow-hidden"
          >
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {children}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface ExpandCollapseAllProps {
  /** True when every group is currently open. */
  allExpanded: boolean;
  onToggleAll: () => void;
  /** Rendered only when there is more than one group to act on. */
  hidden?: boolean;
  className?: string;
}

/**
 * Companion control for a set of `CollapsibleGroup`s.
 *
 * Its accessible name states the *action* ("Collapse all" while everything is
 * open) rather than the state, so the label does not have to be recomputed in
 * two places or drift from what the click will actually do.
 */
export function ExpandCollapseAll({
  allExpanded,
  onToggleAll,
  hidden = false,
  className,
}: ExpandCollapseAllProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onToggleAll}
      aria-label={allExpanded ? "Collapse all groups" : "Expand all groups"}
      className={cn(
        "flex-shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted transition-colors",
        "hover:bg-surface-variant hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        className
      )}
    >
      {allExpanded ? "Collapse all" : "Expand all"}
    </button>
  );
}