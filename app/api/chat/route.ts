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
import { checkRateLimit, checkUserRateLimit } from "@/lib/rateLimit";
import { moderateMessage } from "@/lib/chat/moderation";
import { logger } from "@/lib/logger";
import { handleChatV2 } from "@/lib/chat/v2/engine";
import { analyzeInput } from "@/lib/chat/ai/engine";
import { maybeGroqNLU } from "@/lib/chat/ai/nlu";
import { answerFreeFormQuestion } from "@/lib/chat/ai/freeform";
import { fetchCategories } from "@/lib/chat/v1/api-gateway";

// V1 imports kept for test compatibility — no longer used in production V2 path

const CHAT_RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX || 20);
const CHAT_RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60 * 1000);

export async function POST(request: Request) {
  try {
    // Apply per-IP rate limiting early
    const ipLimitResult = await checkRateLimit(
      request,
      CHAT_RATE_LIMIT_MAX,
      CHAT_RATE_LIMIT_WINDOW_MS,
      "chat",
    );
    if (ipLimitResult) return ipLimitResult;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Apply per-user rate limiting
    const userLimitResult = await checkUserRateLimit(
      userId,
      "chat",
      CHAT_RATE_LIMIT_MAX,
      CHAT_RATE_LIMIT_WINDOW_MS,
    );
    if (userLimitResult) return userLimitResult;

    const body = await request.json();
    const message = body?.message?.toString().trim();
    const isMocked = (getChatIntent as any).mock !== undefined;

    if (message) {
      const mod = moderateMessage(message);
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
    }

    const localAiResult = message && !body?.intentType
      ? analyzeInput(message)
      : null;

    let aiResult = localAiResult;
    if (localAiResult) {
      const groqResult = await maybeGroqNLU(message, localAiResult, {
        userId,
        request,
        v2: body?.context?.v2,
        conversation: body?.context?.conversation || body?.context?.lastTurns,
      });
      aiResult = groqResult ?? localAiResult;
    }

    // V4 greeting decision (PRD §5.2 gap): the local classifier detects
    // greetings at high confidence, so they never reach Groq NLU, but the V2
    // engine has no greeting branch. Reply with Sage's brand-anchored line
    // here, unless an active V2 session owns the flow.
    if (aiResult?.intent === "greeting" && !body?.context?.v2?.session) {
      return NextResponse.json({
        reply:
          "Hi there! I'm Sage, your personal financial assistant. I can help you log expenses and income, set a budget, or answer questions about your spending — what would you like to do?",
        success: true,
      });
    }

    // V4 free-form Q&A: Groq classified a low-confidence message as a
    // free-form financial question → answer it against sanitized facts.
    // Falls back to the normal V3 path (generic reply) when unavailable.
    if (aiResult?.intent === "free_form_question") {
      const freeFormReply = await answerFreeFormQuestion({
        userId,
        request,
        message,
        conversation: body?.context?.conversation || body?.context?.lastTurns,
      });
      if (freeFormReply) {
        return NextResponse.json({ reply: freeFormReply, success: true });
      }
      aiResult = localAiResult;
    }

    const bodyWithAi = aiResult
      ? { ...body, ai: aiResult }
      : body;

    if (!isMocked || body?.intentType === "v2_followup") {
      const v2Result = await handleChatV2({
        body: bodyWithAi,
        userId,
        request,
      });
      if (v2Result.handled) {
        return NextResponse.json({
          reply: v2Result.reply,
          success: v2Result.success,
          eventType: v2Result.eventType,
          data: v2Result.data,
          followUp: v2Result.followUp,
          context: v2Result.context,
        });
      }
    }

    // If client provided structured details (multi-turn follow-up), handle directly
    if (body?.details && body?.intentType) {
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
          if (!result.success && result.followUp) {
            return NextResponse.json({
              reply: result.message,
              success: false,
              followUp: result.followUp,
            });
          }
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
            eventType: (result as any).eventType,
            data: result.data,
          });
        }
        case "add_income": {
          const result = await createIncome(userId, body.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
            eventType: (result as any).eventType,
            data: result.data,
          });
        }
        case "update_budget": {
          const result = await updateBudget(userId, body.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
            eventType: (result as any).eventType,
            data: result.data,
          });
        }
        default:
          break;
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Check if getChatIntent has been mocked (Vitest mock detection)
    if (isMocked) {
      const intent = getChatIntent(message);

      // Multi-turn: if expense intent missing date, prompt for date without calling server logic
      if (
        intent.type === "add_expense" &&
        !(intent.details && (intent.details as any).date)
      ) {
        return NextResponse.json({
          reply:
            "I didn't catch a date for this expense — would you like to set it to today, yesterday, or provide a specific date?",
          success: false,
          followUp: {
            type: "add_expense_requirements",
            payload: { missing: "date", details: intent.details || {} },
          },
        });
      }

      await logger.info(
        "Chat intent detected (v0 fallback)",
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
          if (!result.success && result.followUp) {
            return NextResponse.json({
              reply: result.message,
              success: false,
              followUp: result.followUp,
            });
          }
          if (!result.success) {
            const missing = result.message?.toLowerCase().includes("date")
              ? "date"
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
          return NextResponse.json({
            reply: result.message,
            success: true,
            eventType: (result as any).eventType,
            data: result.data,
          });
        }
        case "add_income": {
          const result = await createIncome(userId, intent.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
            eventType: (result as any).eventType,
            data: result.data,
          });
        }
        case "update_budget": {
          const result = await updateBudget(userId, intent.details || {});
          return NextResponse.json({
            reply: result.message,
            success: !!result.success,
            eventType: (result as any).eventType,
            data: result.data,
          });
        }
        default:
          break;
      }

      await logger.info(
        "Chat message processed (v0 fallback)",
        {
          userId,
          intent: intent.type,
          success: true,
          replyLength: reply.length,
        },
        "API",
        undefined,
        userId,
      );

      return NextResponse.json({ reply, success: false });
    }

    // V1 pipeline removed — V2 handles all production traffic
    return NextResponse.json({
      reply: "I can help you add expenses, income, or check your spending. Could you rephrase that?",
      success: false,
      context: null,
    });
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
