export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  timestamp?: Date;
  operations?: any[];
};

export type ChatAPIRequest = {
  message?: string;
  // Optional structured details for multi-turn flows (e.g., expense details)
  details?: any;
  intentType?: string;
  context?: any; // Allow passing context state
};

export type ChatAPIResponse = {
  reply: string;
  error?: string;
  // optional structured response from server for richer UI handling
  success?: boolean;
  followUp?: { type: string; payload?: any };
  /** Custom window event name dispatched to sync DashboardContext in real-time */
  eventType?: "expenseAdded" | "incomeAdded" | "budgetUpdated" | "batchTransactionsAdded";
  operations?: any[];
  data?: any;
  context?: any; // Allow passing back context state
  /**
   * Where a multi-transaction request ended up: still collecting a missing
   * field, written, or abandoned by the user.
   */
  validationStatus?: "prompt" | "executed" | "cancelled";
  confidence?: {
    intent: string;
    score: number;
    underThreshold: boolean;
  };
};

