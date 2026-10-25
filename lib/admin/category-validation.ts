export const CATEGORY_TYPES = ["Needs", "Wants"] as const;

export const CATEGORY_ICONS = new Set([
  "Smartphone", "Coffee", "Home", "Briefcase", "ShoppingBag", "Zap",
  "Car", "Heart", "Music", "Globe", "Lock", "Gift", "Settings", "Info",
]);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const NAME_MIN = 1;
const NAME_MAX = 40;

export interface CategoryInput {
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

export type CategoryValidationResult =
  | { ok: true; value: CategoryInput }
  | { ok: false; error: string };

/**
 * Validates and normalizes a category/subcategory payload.
 * `mode: "sub"` only allows name + color (type/icon are inherited).
 */
export function validateCategoryInput(
  body: unknown,
  mode: "global" | "sub" = "global"
): CategoryValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const raw = body as Record<string, unknown>;

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { ok: false, error: `Name must be between ${NAME_MIN} and ${NAME_MAX} characters.` };
  }

  let color: string | null = null;
  if (mode === "global" || raw.color !== undefined) {
    const rawColor = typeof raw.color === "string" ? raw.color.trim() : "";
    if (rawColor && !HEX_COLOR.test(rawColor)) {
      return { ok: false, error: "Color must be a 6-digit hex value (e.g. #00D4AA)." };
    }
    color = rawColor || null;
  }

  if (mode === "sub") {
    return { ok: true, value: { name, type: "", color, icon: null } };
  }

  const type = typeof raw.type === "string" ? raw.type.trim() : "";
  if (!(CATEGORY_TYPES as readonly string[]).includes(type)) {
    return { ok: false, error: `Type must be one of: ${CATEGORY_TYPES.join(", ")}.` };
  }

  let icon: string | null = null;
  if (raw.icon !== undefined && raw.icon !== null && raw.icon !== "") {
    const rawIcon = typeof raw.icon === "string" ? raw.icon.trim() : "";
    if (!CATEGORY_ICONS.has(rawIcon)) {
      return { ok: false, error: "Unknown icon." };
    }
    icon = rawIcon;
  }

  return { ok: true, value: { name, type, color, icon } };
}
