/**
 * Server-side validation for admin-editable settings.
 *
 * Values arrive from a browser form, so they are treated as untrusted: every
 * numeric field is bounded and the model identifier is pattern-checked. Returns
 * a normalized object on success or a list of human-readable errors.
 */

export interface AiSettings {
  maxReports: number;
  maxTokens: number;
  model: string;
  quotaAlertThreshold: number;
  costPer1k: number;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const toInt = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

const toFloat = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

export function validateAiSettings(input: unknown): ValidationResult<AiSettings> {
  const errors: string[] = [];
  const raw = (input ?? {}) as Record<string, unknown>;

  const maxReports = toInt(raw.maxReports);
  if (maxReports === null || maxReports < 1 || maxReports > 1000) {
    errors.push("maxReports must be an integer between 1 and 1000");
  }

  const maxTokens = toInt(raw.maxTokens);
  if (maxTokens === null || maxTokens < 128 || maxTokens > 1_000_000) {
    errors.push("maxTokens must be an integer between 128 and 1,000,000");
  }

  const model = typeof raw.model === "string" ? raw.model.trim() : "";
  if (!/^[a-zA-Z0-9._/-]{1,64}$/.test(model)) {
    errors.push("model must be a valid model identifier");
  }

  const quotaAlertThreshold = toInt(raw.quotaAlertThreshold);
  if (quotaAlertThreshold === null || quotaAlertThreshold < 1 || quotaAlertThreshold > 100) {
    errors.push("quotaAlertThreshold must be an integer between 1 and 100");
  }

  const costPer1k = toFloat(raw.costPer1k);
  if (costPer1k === null || costPer1k < 0 || costPer1k > 10_000) {
    errors.push("costPer1k must be between 0 and 10,000");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      maxReports: maxReports as number,
      maxTokens: maxTokens as number,
      model,
      quotaAlertThreshold: quotaAlertThreshold as number,
      costPer1k: costPer1k as number,
    },
  };
}

export function validateBudgetAlertThreshold(input: unknown): ValidationResult<number> {
  const n = toInt(input);
  if (n === null || n < 1 || n > 100) {
    return { ok: false, errors: ["budgetAlertThreshold must be an integer between 1 and 100"] };
  }
  return { ok: true, value: n };
}
