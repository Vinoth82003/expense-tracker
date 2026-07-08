import { logger } from "../logger";

type ExtractionLog = {
  timestamp: string;
  userId: string;
  sessionId: string;
  rawInput: string;
  parsed: {
    amount?: number;
    amountRaw?: string;
    amountApproximate?: boolean;
    note?: string;
    date?: string;
    dateAmbiguous?: boolean;
    category?: string;
    categoryConfidence?: number;
    categoryCandidates?: string[];
    incomeCategory?: string;
  };
  userCorrections?: {
    originalValue: string;
    correctedValue: string;
    field: string;
  }[];
  outcome: "completed" | "cancelled" | "error";
  errorMessage?: string;
};

function sanitizeForLog(value?: string): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 20);
}

export async function logExtraction(
  userId: string,
  sessionId: string,
  rawInput: string,
  parsed: ExtractionLog["parsed"],
  outcome: ExtractionLog["outcome"],
  errorMessage?: string,
  userCorrections?: ExtractionLog["userCorrections"],
) {
  const logEntry: ExtractionLog = {
    timestamp: new Date().toISOString(),
    userId,
    sessionId,
    rawInput: sanitizeForLog(rawInput) || rawInput,
    parsed: {
      ...parsed,
      note: sanitizeForLog(parsed.note),
    },
    outcome,
    ...(errorMessage ? { errorMessage } : {}),
    ...(userCorrections?.length ? { userCorrections } : {}),
  };

  await logger.info("Extraction log", logEntry, "API", undefined, userId);
}
