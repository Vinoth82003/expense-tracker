import { TRAINING_DATA } from "./training-data";
import { preprocessMessage } from "./preprocessor";

export interface IntentResult {
  intent: string;
  confidence: number;
}

// Simple TF-IDF / Token Cosine Similarity Classifier
export function classifyIntent(message: string): IntentResult {
  const normalizedMsg = preprocessMessage(message);
  if (!normalizedMsg) {
    return { intent: "unknown", confidence: 0 };
  }

  // Tokenize the input message
  const msgTokens = normalizedMsg.split(/\s+/);
  const msgSet = new Set(msgTokens);

  let bestIntent = "unknown";
  let maxScore = 0;

  // Let's do a basic Jaccard/Overlap similarity and TF-like matching against training data
  for (const [intent, phrases] of Object.entries(TRAINING_DATA)) {
    for (const phrase of phrases) {
      const phraseNorm = preprocessMessage(phrase);
      const phraseTokens = phraseNorm.split(/\s+/);
      const phraseSet = new Set(phraseTokens);

      // Find intersection
      const intersection = [...msgSet].filter(token => phraseSet.has(token));
      
      // Calculate overlap score
      const overlap = intersection.length;
      const union = new Set([...msgTokens, ...phraseTokens]).size;
      const jaccard = union > 0 ? overlap / union : 0;

      // Give extra weight to direct substring matching of patterns or key words
      let keywordBonus = 0;
      if (intent === "out_of_scope") {
        const outOfScopeKeywords = ["transfer", "pay", "invest", "balance", "upi", "stocks", "crypto", "bank", "credit card"];
        if (outOfScopeKeywords.some(kw => normalizedMsg.includes(kw))) {
          keywordBonus += 0.45;
        }
      }

      if (intent === "add_expense" || intent === "add_income" || intent === "update_budget") {
        const amountRegex = /(?:₹|rs\.?|inr)?\s*([0-9]+(?:[.,][0-9]+)?)/i;
        if (amountRegex.test(normalizedMsg)) {
          if (intent === "add_expense" && (normalizedMsg.includes("spend") || normalizedMsg.includes("spent") || normalizedMsg.includes("bought") || normalizedMsg.includes("paid") || normalizedMsg.includes("add"))) {
            keywordBonus += 0.35;
          }
          if (intent === "add_income" && (normalizedMsg.includes("income") || normalizedMsg.includes("salary") || normalizedMsg.includes("credited") || normalizedMsg.includes("received"))) {
            keywordBonus += 0.35;
          }
          if (intent === "update_budget" && (normalizedMsg.includes("budget") || normalizedMsg.includes("limit"))) {
            keywordBonus += 0.35;
          }
        }
      }

      const finalScore = jaccard + keywordBonus;

      if (finalScore > maxScore) {
        maxScore = finalScore;
        bestIntent = intent;
      }
    }
  }

  // Cap confidence at 1.0
  const confidence = Math.min(maxScore, 1.0);

  if (confidence < 0.25) {
    return { intent: "unknown", confidence };
  }

  return { intent: bestIntent, confidence };
}
