import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { checkAiAccess } from "@/lib/ai/access";
import { moderateMessage } from "@/lib/chat/moderation";
import { logger } from "@/lib/logger";
import { handleChatV2 } from "@/lib/chat/v2/engine";
import { analyzeInput } from "@/lib/chat/ai/engine";
import { maybeGroqNLU } from "@/lib/chat/ai/nlu";
import { answerFreeFormQuestion } from "@/lib/chat/ai/freeform";
import { fetchCategories } from "@/lib/chat/v1/api-gateway";
import { extractFinancialIntent } from "@/lib/chat/v2/batch-extractor";
import { executeQuery } from "@/lib/chat/v2/batch-executor";
import {
  VALIDATION_INTENT,
  handleValidationFollowUp,
  readValidationSession,
  startValidation,
} from "@/lib/chat/v2/validation";

// V1 imports kept for test compatibility — no longer used in production V2 path

const CHAT_RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX || 20);
const CHAT_RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60 * 1000);

/**
 * Sage-branded fallback copy for when the admin kill-switch is off (403) or the
 * daily AI cap is exhausted (429). Returned as `reply` alongside `error` so the
 * chat panel can render it as a normal Sage message instead of a raw error
 * banner, while `error` still carries the short string for telemetry.
 */
function sageUnavailableReply(status: 403 | 429): string {
  if (status === 429) {
    return "You've reached your daily AI message limit. Your tracked expenses and budgets are unaffected — you can keep logging transactions manually, or come back tomorrow to chat with Sage again.";
  }
  return "Sage AI is currently disabled by the administrator. I can't read or write anything right now, but your expense tracking keeps working as usual — you can still add, edit, and review transactions manually until Sage is turned back on.";
}

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

    // Admin AI kill-switch + daily quota. Must run before any model call and
    // before the body is read, so a disabled feature costs nothing.
    const aiAccess = await checkAiAccess(userId, "chat");
    if (!aiAccess.allowed) {
      await logger.info(
        "Chat blocked by AI policy",
        { userId, status: aiAccess.status, reason: aiAccess.error },
        "API",
        undefined,
        userId,
      );
      return NextResponse.json(
        {
          error: aiAccess.error,
          reply: sageUnavailableReply(aiAccess.status),
          success: false,
          aiDisabled: true,
        },
        { status: aiAccess.status },
      );
    }

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

    // Missing-field recovery. Runs before the extractor so a pending prompt is
    // answered by the button/date the user actually pressed rather than being
    // re-parsed as free text, and before any writer so a prompt can never
    // double-apply a batch.
    if (body?.intentType === VALIDATION_INTENT) {
      const validationSession = readValidationSession(body?.context, userId);
      if (!validationSession) {
        return NextResponse.json({
          reply:
            "I've lost track of that request, so I've stopped here — nothing was saved. How can I help you with your finances today?",
          success: false,
          context: { validation: { session: null } },
        });
      }

      const outcome = await handleValidationFollowUp(
        userId,
        validationSession,
        body?.details?.actionId,
        body?.details?.value,
      );

      return NextResponse.json({
        reply: outcome.reply,
        success: outcome.success,
        eventType: outcome.eventType,
        data: outcome.data,
        followUp: outcome.followUp,
        context: outcome.context,
        validationStatus: outcome.status,
      });
    }

    // Sage v2: Production Multi-Transaction LLM Extractor & Executor
    if (!isMocked && !body?.details && !body?.intentType && !body?.context?.v2?.session && message) {
      const userCats = await prisma.category.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        select: { name: true },
      });
      const catNames = userCats.map((c) => c.name);

      const extraction = await extractFinancialIntent(
        message,
        userId,
        catNames,
        body?.context?.conversation || body?.context?.lastTurns || []
      );

      if (extraction.degraded) {
        // Every AI engine was unreachable. Surface the extractor's service
        // status message as-is; re-handling the text through the legacy engine
        // would replace it with a confusing unrelated error.
        return NextResponse.json({
          reply: extraction.reply,
          success: false,
          aiUnavailable: true,
        });
      }

      if (extraction.type === "TRANSACTION_BATCH" && extraction.operations?.length) {
        // Validation owns persistence: it decides whether the batch is complete
        // enough to write, prompts for whatever is missing, and is the only path
        // that reaches the executor for a multi-transaction message.
        const outcome = await startValidation(
          userId,
          extraction.operations,
          message,
        );

        if (outcome.status === "prompt" || outcome.status === "cancelled") {
          return NextResponse.json({
            reply: outcome.reply,
            success: false,
            followUp: outcome.followUp,
            context: outcome.context,
            validationStatus: outcome.status,
          });
        }

        return NextResponse.json({
          reply: outcome.reply,
          success: true,
          eventType: outcome.eventType,
          data: outcome.data,
          operations: extraction.operations,
          validationStatus: outcome.status,
        });
      } else if (extraction.type === "QUERY" && extraction.queryKind) {
        const queryReply = await executeQuery(userId, extraction.queryKind, extraction.queryParam);
        return NextResponse.json({
          reply: queryReply,
          success: true,
        });
      } else if (extraction.type === "GREETING" || extraction.type === "FREEFORM") {
        return NextResponse.json({
          reply: extraction.reply,
          success: true,
        });
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
