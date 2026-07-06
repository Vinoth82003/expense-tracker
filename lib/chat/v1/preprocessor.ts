/**
 * Normalizes text input for processing.
 * - Converts to lowercase.
 * - Standardizes currency symbols: ₹, Rs., Rs, INR, rupees -> ₹
 * - Standardizes number spacing.
 * - Cleans basic punctuation but preserves date separators and currency.
 */
export function preprocessMessage(text: string): string {
  if (!text) return "";
  
  let normalized = text.toLowerCase().trim();

  // Standardize currency formats
  normalized = normalized.replace(/\b(?:rs\.?|inr|rupees)\b\.?\s*/gi, "₹");
  // Handle case where rs/inr is next to a digit without a space (e.g. Rs500)
  normalized = normalized.replace(/(?:rs\.?|inr|rupees)\.?\s*(\d+)/gi, "₹$1");

  // Normalize numbers with commas (e.g., 1,200 -> 1200)
  normalized = normalized.replace(/(\d+),(\d+)/g, "$1$2");

  // Normalize word numbers commonly used
  const wordNumbers: Record<string, string> = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "thousand": "1000", "lakh": "100000"
  };

  for (const [word, num] of Object.entries(wordNumbers)) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    normalized = normalized.replace(regex, num);
  }

  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, " ");

  return normalized;
}
