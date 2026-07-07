import { preprocessMessage } from "./preprocessor";
import { resolveSynonym } from "./synonyms";

export interface ExtractedEntities {
  amount?: number;
  category?: string;
  dateStr?: string;
  note?: string;
  fromDate?: Date;
  toDate?: Date;
}

export function extractEntities(message: string): ExtractedEntities {
  const normalized = preprocessMessage(message);
  const entities: ExtractedEntities = {};

  // 1. Amount Extraction (match ₹ followed by digit or space + digit, or just digit near keywords)
  const amountMatch = normalized.match(/(?:₹)\s*(\d+(?:\.\d+)?)/i);
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1]);
  } else {
    // Fallback search for a standalone digit in context of money queries
    const fallbackMatch = normalized.match(/\b(\d+(?:\.\d+)?)\b/);
    if (fallbackMatch) {
      const parsed = parseFloat(fallbackMatch[1]);
      if (
        parsed > 0 &&
        (normalized.includes("spent") ||
          normalized.includes("add") ||
          normalized.includes("paid") ||
          normalized.includes("budget") ||
          normalized.includes("salary"))
      ) {
        entities.amount = parsed;
      }
    }
  }

  // 2. Category matching via synonyms dictionary
  const tokens = normalized.split(/\s+/);
  for (const token of tokens) {
    // Strip punctuation
    const cleanToken = token.replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()]/g, "");

    // Check resolveSynonym, but skip generic words like 'spent'/'paid' for category resolution
    if (
      cleanToken === "spent" ||
      cleanToken === "paid" ||
      cleanToken === "bought"
    ) {
      continue;
    }

    const resolved = resolveSynonym(cleanToken);
    if (resolved) {
      entities.category = resolved.charAt(0).toUpperCase() + resolved.slice(1);
      break;
    }
  }

  // 3. Date Parsing / Timeframes
  const today = new Date();
  if (normalized.includes("today")) {
    entities.dateStr = "today";
    entities.fromDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    entities.toDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );
  } else if (normalized.includes("yesterday")) {
    entities.dateStr = "yesterday";
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    entities.fromDate = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );
    entities.toDate = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
    );
  } else if (normalized.includes("this month")) {
    entities.dateStr = "this month";
    entities.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    entities.toDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
  } else if (normalized.includes("last month")) {
    entities.dateStr = "last month";
    entities.fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    entities.toDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59,
    );
  }

  // 4. Note extraction (heuristically)
  // "Add ₹250 for taxi today" -> taxi
  // "Record ₹1200 for groceries" -> groceries
  const noteMatch = normalized.match(
    /(?:for|on|worth)\s+([a-zA-Z\s]+?)(?:\s+(?:today|yesterday|tomorrow|this month|last month|₹|\d|$))/i,
  );
  if (noteMatch) {
    entities.note = noteMatch[1].trim();
  }

  return entities;
}
