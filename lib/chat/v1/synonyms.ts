export const SYNONYMS: Record<string, string[]> = {
  expense: ["spent", "paid", "bought", "purchased", "expense", "cost", "charge", "outgo"],
  income: ["salary", "earned", "received", "credited", "bonus", "income", "freelance", "rented", "cash received", "paycheck"],
  budget: ["budget", "limit", "cap", "allocation", "monthly budget", "monthly limit"],
  food: ["groceries", "grocery", "food", "dining", "lunch", "dinner", "breakfast", "coffee", "restaurant", "cafe", "coke", "biryani", "pizza", "burger", "snacks", "tea", "starbucks"],
  transport: ["petrol", "fuel", "diesel", "cab", "taxi", "uber", "ola", "auto", "train", "bus", "metro", "transportation", "flight"],
  entertainment: ["movie", "cinema", "netflix", "prime", "spotify", "ticket", "tickets", "show", "game", "gaming", "concert", "outing", "clubbing"],
  utilities: ["electricity", "power", "water", "gas", "internet", "wifi", "broadband", "recharge", "bill", "bills", "phone bill", "mobile bill"],
  health: ["medicine", "medical", "doctor", "hospital", "pharmacy", "clinic", "pills", "health checkup"],
  shopping: ["shoes", "clothes", "shirt", "jeans", "amazon", "flipkart", "myntra", "nike", "puma", "adidas", "mall", "shopping", "gift"],
  sports: ["cricket", "football", "badminton", "turf", "gym", "workout", "fitness", "sports", "tennis"]
};

// Quick helper to find standard category name from synonym text
export function resolveSynonym(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, list] of Object.entries(SYNONYMS)) {
    if (list.includes(lower)) return key;
  }
  return null;
}
