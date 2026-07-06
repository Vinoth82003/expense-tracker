import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChatIntent } from "@/lib/chat/intent";
import {
  createExpense,
  createIncome,
  getBudgetStatus,
  getExpenseSummary,
  getIncomeSummary,
  updateBudget,
} from "@/lib/chat/server";
import { rateLimiter } from "@/lib/rateLimit";
import { moderateMessage } from "@/lib/chat/moderation";
import { logger } from "@/lib/logger";

const chatRateLimit = rateLimiter(
  Number(process.env.CHAT_RATE_LIMIT_MAX || 30),
  Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60 * 1000),
);

export async function POST(request: Request) {
  try {
    // Apply simple rate limiting early
    const limitResult = chatRateLimit(request);
    if (limitResult) return limitResult;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const message = body?.message?.toString().trim();

    // If client provided structured details (multi-turn follow-up), handle directly
    if (body?.details && body?.intentType) {
      const userId = (session.user as any).id;
      await logger.info(
        "Chat follow-up detected",
        { userId, intent: body.intentType },
        "API",
        undefined,
        userId,
      );

      switch (body.intentType) {
        case "add_expense": {
          const result = await createExpense(userId, body.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
          });
        }
        case "add_income": {
          const result = await createIncome(userId, body.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
          });
        }
        case "update_budget": {
          const result = await updateBudget(userId, body.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
          });
        }
        default:
          break;
      }
    }

    // Basic content moderation before processing
    const mod = moderateMessage(message || "");
    if (!mod.allowed) {
      await logger.info(
        "Chat message blocked by moderation",
        { reason: mod.reason, userId: (session?.user as any)?.id },
        "API",
        undefined,
        (session?.user as any)?.id,
      );
      return NextResponse.json(
        { error: "Message blocked for safety." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const userId = (session.user as any).id;
    const intent = getChatIntent(message);

    // Multi-turn: if expense intent missing date, prompt for date without calling server logic
    if (intent.type === "add_expense" && !(intent.details && (intent.details as any).date)) {
      return NextResponse.json({
        reply: "I didn't catch a date for this expense — would you like to set it to today, yesterday, or provide a specific date?",
        success: false,
        followUp: {
          type: "add_expense_requirements",
          payload: { missing: "date", details: intent.details || {} },
        },
      });
    }

    await logger.info(
      "Chat intent detected",
      { userId, intent: intent.type, messageLength: message.length },
      "API",
      undefined,
      userId,
    );

    let reply =
      "I'm not sure how to help with that yet. Ask me about your expenses, income, or budget status.";

    switch (intent.type) {
      case "expense_summary":
        reply = await getExpenseSummary(userId, intent.timeframe!);
        break;
      case "income_summary":
        reply = await getIncomeSummary(userId, intent.timeframe!);
        break;
      case "budget_status":
        reply = await getBudgetStatus(userId);
        break;
      case "add_expense": {
        const result = await createExpense(userId, intent.details || {});
        // If server asks for follow-up (multi-turn), return structured followUp payload with the original details
        if (!result.success) {
          const missing = result.message?.toLowerCase().includes("date")
            ? "date"
            : result.message?.toLowerCase().includes("category")
              ? "category"
              : "info";
          return NextResponse.json({
            reply: result.message,
            success: false,
            followUp: {
              type: "add_expense_requirements",
              payload: { missing, details: intent.details || {} },
            },
          });
        }
        reply = result.message;
        break;
      }
      case "add_income": {
        const result = await createIncome(userId, intent.details || {});
        reply = result.message;
        break;
      }
      case "update_budget": {
        const result = await updateBudget(userId, intent.details || {});
        reply = result.message;
        break;
      }
      default:
        break;
    }

    // Log successful message handling for telemetry/audit
    await logger.info(
      "Chat message processed",
      { userId, intent: intent.type, success: true, replyLength: reply.length },
      "API",
      undefined,
      userId,
    );

    return NextResponse.json({ reply });
  } catch (error) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    await logger.error(
      "Chat route failed",
      { error: String(error), userId },
      "API",
      undefined,
      userId as string,
    );
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
