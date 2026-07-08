// ── Category Keyword Mappings ────────────────────────────────────────────
// Single source of truth for all keyword→category mappings.
// Merged from: types/keywords.ts, lib/chat/v2/engine.ts,
//              lib/chat/v1/synonyms.ts, lib/chat/v1/handlers/write-handler.ts

export type CategoryMapping = {
  category: string;
  type: "Needs" | "Wants";
  keywords: string[];
};

export const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    category: "Food",
    type: "Needs",
    keywords: [
      "food", "lunch", "dinner", "breakfast", "snack", "snacks", "tiffin", "meals", "thali",
      "mess", "canteen", "cafeteria", "coffee", "ccd", "cafe coffee day", "starbucks", "chai",
      "tea", "juice", "lassi", "milkshake", "restaurant", "dhaba",
      "swiggy", "zomato", "eatsure", "faasos",
      "biryani", "biriyani", "briyani", "behrani", "pulao",
      "fried rice", "friedrice", "noodles", "chowmein", "chow mein", "momos", "momo",
      "idli", "idly", "dosa", "dosai", "vada", "vadai", "sambar", "sambhar", "chutney",
      "uttapam", "uthappam", "poha", "upma",
      "paratha", "parota", "parotta", "porotta", "roti", "chapati", "chapathi",
      "naan", "kulcha", "sabzi", "sabji", "curry", "dal", "daal", "rajma", "chole",
      "cholebhature", "chole bhature", "paneer",
      "samosa", "samosas", "kachori", "pakora", "pakoda", "bhaji", "bajji",
      "vada pav", "vadapav", "pav bhaji", "pavbhaji", "dabeli",
      "chaat", "chat", "bhel puri", "bhelpuri", "sev puri", "sevpuri",
      "pani puri", "panipuri", "golgappa", "golgappe", "gupchup", "dahi puri", "tikki",
      "curd rice", "curdrice", "lemon rice", "puliyodarai",
      "chicken", "mutton", "fish", "fish curry", "egg curry", "omelette", "omelet",
      "sandwich", "burger", "pizza", "dominos", "mcdonalds", "kfc", "subway",
      "bakery", "bread", "cake", "sweets", "mithai",
      "gulab jamun", "gulabjamun", "rasgulla", "rasagulla", "jalebi",
      "laddu", "ladoo", "barfi", "burfi", "halwa", "kheer",
      "ice cream", "icecream",
    ],
  },
  {
    category: "Groceries",
    type: "Needs",
    keywords: [
      "groceries", "grocery", "kirana",
      "bigbasket", "blinkit", "zepto", "instamart", "dunzo",
      "dmart", "reliance fresh", "more supermarket", "spencers", "nature basket",
      "vegetables", "veggies", "fruits", "milk", "eggs",
    ],
  },
  {
    category: "Transport",
    type: "Needs",
    keywords: [
      "transport", "transportation",
      "petrol", "diesel", "cng", "fuel", "petrol pump", "ev charging",
      "toll", "fastag", "parking", "puncture",
      "vehicle service", "bike service", "car service",
    ],
  },
  {
    category: "Commute",
    type: "Needs",
    keywords: [
      "taxi", "cab", "uber", "ola", "olacabs", "rapido", "namma yatri",
      "auto", "autorickshaw", "auto rickshaw", "rickshaw", "shared auto",
      "bus", "state bus", "ksrtc", "msrtc", "tsrtc", "volvo", "redbus",
      "train", "irctc", "railway", "railway ticket", "sleeper", "tatkal",
      "metro", "metro card", "metro recharge",
      "local", "local train",
    ],
  },
  {
    category: "Travel",
    type: "Wants",
    keywords: [
      "travel", "trip", "vacation", "holiday", "tour",
      "flight", "flightticket", "flight ticket", "airline", "airfare",
      "indigo", "spicejet", "vistara", "air india", "akasa", "boardingpass",
      "hotel", "oyo", "airbnb", "lodge", "homestay",
      "makemytrip", "goibibo", "yatra", "cleartrip", "ixigo",
    ],
  },
  {
    category: "Utilities",
    type: "Needs",
    keywords: [
      "utilities", "utility",
      "electricity", "eb", "water", "gas",
      "internet", "broadband", "wifi",
      "gas cylinder", "lpg",
      "maintenance", "society maintenance",
    ],
  },
  {
    category: "Bills",
    type: "Needs",
    keywords: [
      "bill", "bills", "phone bill", "mobile bill",
      "phone", "recharge",
      "jio", "airtel", "vi", "vodafone", "bsnl",
      "dth", "tatasky",
    ],
  },
  {
    category: "Health",
    type: "Needs",
    keywords: [
      "health", "medical",
      "medicine", "medicines", "tablets", "pills",
      "doctor", "hospital", "pharmacy", "clinic", "dentist",
      "apollo", "practo", "1mg", "pharmeasy", "netmeds",
      "checkup", "blood test", "scan", "xray",
      "physiotherapy", "ambulance",
      "health insurance", "consultation",
    ],
  },
  {
    category: "Education",
    type: "Needs",
    keywords: [
      "education",
      "course", "book", "books", "school", "college", "tuition", "coaching",
      "fees", "exam fee", "admission",
      "byjus", "unacademy", "udemy", "coursera",
      "stationery", "notebooks", "uniform",
    ],
  },
  {
    category: "Rent",
    type: "Needs",
    keywords: [
      "rent", "house rent", "pg rent", "hostel fee", "deposit", "brokerage",
    ],
  },
  {
    category: "Shopping",
    type: "Wants",
    keywords: [
      "shopping",
      "shoes", "clothes", "clothing", "dress", "shirt", "jeans",
      "puma", "adidas", "nike", "reebok", "bata",
      "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "snapdeal",
      "tatacliq", "croma", "reliance digital", "big bazaar",
      "lifestyle", "pantaloons", "westside", "max fashion", "shoppers stop",
      "decathlon",
      "electronics", "mobile", "laptop",
      "cosmetics", "makeup",
      "jewellery", "jewelry",
      "watch", "bag", "wallet", "gift",
    ],
  },
  {
    category: "Entertainment",
    type: "Wants",
    keywords: [
      "entertainment",
      "movie", "movies", "cinema",
      "bookmyshow", "pvr", "inox", "cinepolis",
      "concert", "picnic", "outing", "zoo", "museum",
      "amusement park", "waterpark", "water park",
      "game", "gaming", "pubg", "playstation", "xbox", "steam",
    ],
  },
  {
    category: "Subscription",
    type: "Wants",
    keywords: [
      "subscription",
      "netflix", "spotify", "amazon prime", "primevideo", "hotstar",
      "jiocinema", "sonyliv", "zee5", "gaana", "wynk",
    ],
  },
  {
    category: "Sports",
    type: "Wants",
    keywords: [
      "sports", "fitness",
      "cricket", "gully cricket", "box cricket",
      "football", "hockey", "volleyball", "basketball", "baseball", "kabaddi",
      "kho kho", "khokho",
      "badminton", "badmitton", "tennis",
      "table tennis", "tabletennis", "tt",
      "squash", "carrom", "chess",
      "turf", "stadium", "sports club", "sports complex", "playzone", "arena",
      "gym", "yoga", "zumba", "crossfit", "aerobics", "pilates",
      "personal trainer", "pt session",
      "swimming", "marathon", "running", "cycling", "cycle",
    ],
  },
  {
    category: "Fuel",
    type: "Needs",
    keywords: [
      "petrol", "diesel", "cng", "fuel", "petrol pump", "ev charging",
    ],
  },
];

export const SPORTS_KEYWORDS: string[] = [
  "cricket", "gully cricket", "box cricket",
  "football", "hockey", "volleyball", "basketball", "baseball", "kabaddi",
  "kho kho", "khokho",
  "badminton", "badmitton", "tennis", "table tennis", "tabletennis", "tt",
  "squash", "carrom", "chess",
  "gym", "yoga", "zumba", "crossfit", "aerobics", "pilates",
  "personal trainer", "pt session",
  "swimming", "marathon", "running", "cycling", "cycle",
  "turf", "stadium", "sports club", "sports complex", "playzone", "arena",
];

// ── Helpers ──────────────────────────────────────────────────────────────

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function scoreCategories(
  text: string,
  userCategories?: Array<{ name: string; type: string }>,
): Array<{ category: string; type: string; score: number }> {
  const normalized = text.toLowerCase();
  const scores: Record<string, { category: string; type: string; score: number }> = {};

  for (const mapping of CATEGORY_MAPPINGS) {
    let matchScore = 0;
    for (const keyword of mapping.keywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
      if (regex.test(normalized)) {
        matchScore = Math.max(matchScore, 0.82);
        break;
      }
    }

    if (matchScore > 0) {
      const existing = scores[mapping.category];
      scores[mapping.category] = {
        category: mapping.category,
        type: mapping.type,
        score: Math.max(existing?.score || 0, matchScore),
      };
    }
  }

  if (userCategories) {
    for (const userCat of userCategories) {
      if (normalized.includes(userCat.name.toLowerCase())) {
        scores[userCat.name] = {
          category: userCat.name,
          type: userCat.type,
          score: Math.max(scores[userCat.name]?.score || 0, 0.9),
        };
      }
    }
  }

  return Object.values(scores).sort((a, b) => b.score - a.score);
}

export function matchCategoryFromText(
  text: string,
  userCategories: Array<{ name: string; type: string }>,
): { name: string; type: string } | null {
  const scored = scoreCategories(text, userCategories);
  for (const candidate of scored) {
    const found = userCategories.find(
      (c) => c.name.toLowerCase() === candidate.category.toLowerCase(),
    );
    if (found) return { name: found.name, type: found.type };
  }
  return null;
}

export function extractSportsKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of SPORTS_KEYWORDS) {
    if (new RegExp(`\\b${escapeRegex(kw)}\\b`, "i").test(lower)) return kw;
  }
  return null;
}

function stemWord(word: string): string {
  return word
    .replace(/ing$/, "")
    .replace(/ed$/, "")
    .replace(/s$/, "")
    .replace(/tion$/, "te");
}

export function findNearDuplicate(
  name: string,
  type: string,
  categories: Array<{ name: string; type: string }>,
): { name: string; type: string } | undefined {
  const normalized = name.toLowerCase().trim();
  const stemmed = normalized.split(/\s+/).map(stemWord).join(" ");

  const exact = categories.find(
    (c) => c.type === type && c.name.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const candidates = categories.filter((c) => c.type === type);
  for (const candidate of candidates) {
    if (jaccardSimilarity(normalized, normalizeName(candidate.name)) >= 0.75) return candidate;

    const candStemmed = normalizeName(candidate.name).split(/\s+/).map(stemWord).join(" ");
    if (stemmed === candStemmed) return candidate;

    if (candidate.name.length < 10 && normalized.length < 10) {
      const dist = levenshtein(normalized, candidate.name.toLowerCase());
      if (dist <= 2) return candidate;
    }
  }

  return undefined;
}

function normalizeName(value: string) {
  return value.toLowerCase().trim();
}

export function jaccardSimilarity(a: string, b: string) {
  const aTokens = new Set(normalizeName(a).split(/\s+/).filter(Boolean));
  const bTokens = new Set(normalizeName(b).split(/\s+/).filter(Boolean));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size || 1;
  return intersection / union;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
