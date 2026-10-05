"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ModeToggleLabels = {
  /** Label for the OFF / left state. */
  off: string;
  /** Label for the ON / right state. */
  on: string;
};

interface ModeToggleProps {
  /** ON = budget enforcement, OFF = free spending. */
  checked: boolean;
  onChange: (next: boolean) => void;
  labels: ModeToggleLabels;
  /** Accessible name for the whole control, e.g. "Budget mode". */
  label: string;
  /** Shown under the control when the switch has an error to report. */
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Geometry is pinned with inline styles rather than utility classes.
 *
 * An arbitrary-value class such as `top-[3px]` is emitted only if Tailwind's
 * scanner picks it up, and when it is missed the absolutely positioned thumb has
 * no `top` — it lands on the track's top edge and reads as a stray mark above
 * the switch rather than a knob. The numbers below are therefore literal, so the
 * control renders identically no matter what the CSS pipeline does.
 *
 *   track 44x24, thumb 18x18, 2px inset at each end
 *   => thumb top = (24 - 18) / 2 = 3
 *   => thumb x   = 2 (left) .. 24 (right)
 *
 * Track and thumb keep these exact dimensions in both states, so toggling
 * reflows nothing and the labels never shift.
 *
 * The thumb moves on a plain CSS `transform` transition instead of a Framer
 * animation: Framer writes the whole `transform` property, which leaves no room
 * for a utility-class transform to coexist and is more machinery than a
 * two-position slide needs.
 *
 * OFF = grey track, thumb left. ON = green track, thumb right. The labels carry
 * the same split, so `Free` always corresponds to the left/OFF side and `Budget`
 * to the right/ON side.
 */
export default function ModeToggle({
  checked,
  onChange,
  labels,
  label,
  error,
  disabled = false,
  className,
}: ModeToggleProps) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 200;

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        // Only set when there is an error to report, so the switch is not
        // announced as permanently in an invalid state.
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex touch-manipulation select-none items-center gap-3 rounded-full py-1.5 pl-2 pr-2",
          "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "text-xs leading-none transition-colors",
            checked ? "text-muted" : "font-semibold text-foreground"
          )}
        >
          {labels.off}
        </span>

        <span
          aria-hidden="true"
          style={{
            position: "relative",
            display: "inline-block",
            flexShrink: 0,
            width: 44,
            height: 24,
            borderRadius: 9999,
            background: checked ? "var(--color-success)" : "var(--bg-surface-variant)",
            border: `1px solid ${
              checked ? "var(--color-success)" : "var(--border-color)"
            }`,
            transition: `background-color ${duration}ms ease, border-color ${duration}ms ease`,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: 0,
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.28)",
              transform: `translateX(${checked ? 24 : 2}px)`,
              transition: `transform ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`,
            }}
          />
        </span>

        <span
          aria-hidden="true"
          className={cn(
            "text-xs leading-none transition-colors",
            checked ? "font-semibold text-foreground" : "text-muted"
          )}
        >
          {labels.on}
        </span>
      </button>

      {error && (
        <p role="alert" className="px-2 text-[11px] font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}