"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useUI } from "@/context/UIContext";

export interface SubcategoryOption {
  id: string;
  name: string;
  type: string;
  /** Set when the user hid this system category in Settings > Categories. */
  hidden?: boolean;
}

interface SubcategoryPickerProps {
  /** Parent category ("Needs" / "Wants") whose subcategories to offer. */
  type: string;
  /** Currently selected subcategory name. */
  value: string;
  onChange: (name: string) => void;
  invalid?: boolean;
  /**
   * Id for the underlying `<select>`, so a visible `<label htmlFor>` can be
   * associated with it. When supplied, the hardcoded `aria-label` below is
   * dropped — two competing names means the visible label is silently ignored.
   */
  id?: string;
  /**
   * Sizing preset. "lg" matches the add/edit modal fields, "sm" the compact
   * inline detail sheets.
   */
  size?: "lg" | "sm";
}

/**
 * The single source of truth for picking a subcategory.
 *
 * Both the add modal and the edit surfaces render this, which is what keeps
 * them in sync: previously the edit sheets used a free-text input, so editing
 * could save a subcategory that no Category row backed, and switching the
 * parent category left a stale subcategory from the other side of the split.
 */
export default function SubcategoryPicker({
  type,
  value,
  onChange,
  invalid = false,
  id,
  size = "lg",
}: SubcategoryPickerProps) {
  const [categories, setCategories] = useState<SubcategoryOption[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const { toast } = useUI();

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      // Non-fatal: the select still renders, and custom entry still works.
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Changing the parent category invalidates any half-typed custom name.
  useEffect(() => {
    setIsAddingCustom(false);
    setCustomName("");
  }, [type]);

  const filtered = useMemo(
    () => categories.filter((c) => c.type === type && !c.hidden),
    [categories, type]
  );

  const handleCreateCustom = async () => {
    const name = customName.trim();
    if (!name) return;

    setSavingCustom(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to create category");
        return;
      }
      const data = await res.json();
      setCategories((prev) =>
        [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name))
      );
      onChange(data.category.name);
      setIsAddingCustom(false);
      setCustomName("");
      toast.success(`"${data.category.name}" added`);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSavingCustom(false);
    }
  };

  const lg = size === "lg";
  const fieldClass = lg
    ? "w-full bg-background border-2 rounded-2xl py-4 pl-12 pr-10 font-bold text-foreground appearance-none focus:outline-none transition-all"
    : "w-full bg-background border border-border-subtle rounded-xl py-3.5 pl-11 pr-10 text-sm font-medium text-foreground appearance-none outline-none focus:border-primary-500 transition-colors";

  return (
    <div>
      {isAddingCustom ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            placeholder="New subcategory…"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateCustom();
              }
              if (e.key === "Escape") {
                setIsAddingCustom(false);
                setCustomName("");
              }
            }}
            className={fieldClass}
          />
          <button
            type="button"
            aria-label="Save subcategory"
            disabled={savingCustom || !customName.trim()}
            onClick={handleCreateCustom}
            className="p-4 rounded-2xl bg-primary-500 text-white disabled:opacity-50 active:scale-95 transition-transform shrink-0"
          >
            {savingCustom ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Check size={20} />
            )}
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setIsAddingCustom(false);
              setCustomName("");
            }}
            className="p-4 rounded-2xl bg-surface-variant text-secondary hover:text-foreground active:scale-95 transition-transform shrink-0"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <select
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={id ? undefined : "Subcategory"}
              aria-invalid={invalid}
              className={`${fieldClass} ${
                invalid ? "border-error" : "border-border-subtle focus:border-primary-500"
              }`}
            >
              <option value="">Select subcategory…</option>
              {/* Keep a saved value selectable even if its Category row was
                  deleted or hidden, otherwise editing would silently drop it. */}
              {value && !filtered.some((c) => c.name === value) && (
                <option value={value}>{value} (not in list)</option>
              )}
              {filtered.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsAddingCustom(true)}
            className="mt-2 ml-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors"
          >
            <Plus size={12} strokeWidth={3} /> Add custom
          </button>
        </>
      )}
    </div>
  );
}