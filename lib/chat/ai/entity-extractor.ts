import type { AIEntityResult } from "./types";

function sanitizeFreeText(value?: string | null, maxLength = 80) {
  if (!value) return "";
  return value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function extractAmount(message: string): Pick<AIEntityResult, "amount" | "amountRaw" | "amountApproximate"> | null {
  const match = message.match(/(-?\d[\d,]*(?:\.\d{1,4})?)\s*(k|l|lakh)?/i);
  if (!match) return null;

  const rawValue = match[1].replace(/,/g, "");
  const suffix = (match[2] || "").toLowerCase();
  const approximate = /\b(about|around|approx|approximately)\b/i.test(message);
  let amount = Number(rawValue);

  if (Number.isNaN(amount) || amount < 0) return null;

  if (suffix === "k") amount *= 1000;
  if (suffix === "l" || suffix === "lakh") amount *= 100000;

  return {
    amount,
    amountRaw: match[0],
    amountApproximate: approximate,
  };
}

const INCOME_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\bsalary\b/i, category: "Salary" },
  { pattern: /\b(uncle|dad|mom|father|mother|gift|gave me|pocket money|allowance)\b/i, category: "Gift" },
  { pattern: /\b(returns|dividend|interest|investment|mutual fund|stock)\b/i, category: "Investment" },
  { pattern: /\b(freelance|freelancer|contract|project|client|gig)\b/i, category: "Freelance" },
  { pattern: /\b(bonus|commission|incentive)\b/i, category: "Bonus" },
  { pattern: /\b(received|got|earned)\b/i, category: "Others" },
];

function extractIncomeCategory(message: string): string | undefined {
  const lower = message.toLowerCase();
  for (const { pattern, category } of INCOME_PATTERNS) {
    if (pattern.test(lower)) return category;
  }
  return undefined;
}

function extractDate(message: string): Pick<AIEntityResult, "date" | "dateAmbiguous"> | null {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const now = new Date();

  if (lower === "today") {
    const d = formatDate(now);
    return { date: d, dateAmbiguous: false };
  }
  if (lower === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { date: formatDate(d), dateAmbiguous: false };
  }
  if (/^last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.test(lower)) {
    return null;
  }

  const ambiguousMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (ambiguousMatch) {
    const first = Number(ambiguousMatch[1]);
    const second = Number(ambiguousMatch[2]);
    if (first <= 12 && second <= 12) {
      const year = ambiguousMatch[3].length === 2 ? `20${ambiguousMatch[3]}` : ambiguousMatch[3];
      return { date: `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`, dateAmbiguous: true };
    }
  }

  const parsed = tryParseDate(trimmed);
  if (parsed) {
    return { date: parsed, dateAmbiguous: false };
  }

  return null;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tryParseDate(text: string): string | null {
  const now = new Date();
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})$/i,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (const fmt of formats) {
    const m = text.match(fmt);
    if (m) {
      const groups = m.slice(1);
      if (groups.length === 3) {
        const month = isNaN(Number(groups[1])) ? monthIndex(groups[1]) : Number(groups[1]);
        const day = Number(groups[0]);
        const year = Number(groups[2]);
        if (month > 0 && month <= 12 && day > 0 && day <= 31) {
          const d = new Date(year, month - 1, day);
          if (d.getMonth() === month - 1) {
            return formatDate(d);
          }
        }
      }
    }
  }
  return null;
}

function monthIndex(name: string): number {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return months.indexOf(name.slice(0, 3).toLowerCase()) + 1;
}

function extractNote(message: string): string {
  const cleaned = sanitizeFreeText(
    message
      .replace(/₹/g, "")
      .replace(/-?\d[\d,]*(?:\.\d{1,4})?\s*(?:k|l|lakh)?/gi, "")
      .replace(/\b(today|yesterday|last\s+\w+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi, "")
      .replace(/\b(spent|spend|paid|bought|buy|purchase|for|on|add|expense|log|record)\b/gi, "")
      .replace(/\b(got|received|earned|salary|income|from|credit|credited)\b/gi, ""),
  );
  return cleaned ? titleCase(cleaned) : "";
}

export function extractEntities(message: string): AIEntityResult {
  const result: AIEntityResult = {};

  const amountResult = extractAmount(message);
  if (amountResult) {
    result.amount = amountResult.amount;
    result.amountRaw = amountResult.amountRaw;
    result.amountApproximate = amountResult.amountApproximate;
  }

  const dateResult = extractDate(message);
  if (dateResult) {
    result.date = dateResult.date;
    result.dateAmbiguous = dateResult.dateAmbiguous;
  }

  const note = extractNote(message);
  if (note) {
    result.note = note;
  }

  const incomeCategory = extractIncomeCategory(message);
  if (incomeCategory) {
    result.incomeCategory = incomeCategory;
  }

  return result;
}
