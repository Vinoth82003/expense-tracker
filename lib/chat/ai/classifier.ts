import { CATEGORY_MAPPINGS, jaccardSimilarity } from "../categories";
import type { AIClassificationResult } from "./types";

type ChatCategory = {
  id: string;
  name: string;
  type: "Needs" | "Wants";
  isDefault?: boolean;
  userId?: string | null;
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function classifyCategory(
  text: string,
  userCategories: ChatCategory[],
): AIClassificationResult {
  const normalized = text.toLowerCase();

  const directMatch = userCategories.find(
    (c) => normalized.includes(c.name.toLowerCase()),
  );
  if (directMatch) {
    return {
      category: directMatch.name,
      categoryType: directMatch.type,
      confidence: 0.95,
      candidates: [{ name: directMatch.name, type: directMatch.type, score: 0.95 }],
    };
  }

  const scoredCandidates: Array<{ name: string; type: string; score: number }> = [];

  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
      if (regex.test(normalized)) {
        scoredCandidates.push({
          name: mapping.category,
          type: mapping.type,
          score: 0.85,
        });
        break;
      }
    }
  }

  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (jaccardSimilarity(normalized, keyword) >= 0.6) {
        const exists = scoredCandidates.some((c) => c.name === mapping.category);
        if (!exists) {
          scoredCandidates.push({
            name: mapping.category,
            type: mapping.type,
            score: 0.7,
          });
        }
        break;
      }
    }
  }

  const best = scoredCandidates.sort((a, b) => b.score - a.score)[0];

  if (best && best.score >= 0.7) {
    return {
      category: best.name,
      categoryType: best.type as "Needs" | "Wants",
      confidence: best.score,
      candidates: scoredCandidates.slice(0, 3),
    };
  }

  const needsKeywords = /\b(rent|medicine|grocery|utility|electricity|water|gas|fuel|petrol|school|college|tuition|doctor|hospital|insurance|maintenance)\b/i;
  const isNeeds = needsKeywords.test(normalized);

  return {
    category: "Other",
    categoryType: isNeeds ? "Needs" : "Wants",
    confidence: 0.3,
    candidates: scoredCandidates.slice(0, 3),
  };
}
