import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { sanitizePii } from "@/lib/pii";
import { isGroqChatEnabled, callGroqAnalyze } from "@/lib/chat/groq";
import { buildAnalysisSystemPrompt, validateAnalysisReport } from "@/lib/chat/ai/analyze";
import { estimateCostUsd, logAiUsage } from "@/lib/chat/ai/usage";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const reportId = req.nextUrl.searchParams.get("id");

  try {
    const history = await prisma.report.findMany({
      where: { userId },
      select: { id: true, date: true },
      orderBy: { date: "desc" }
    });

    let selectedReport = null;
    if (reportId) {
      selectedReport = await prisma.report.findUnique({
        where: { id: reportId, userId }
      });
    } else {
      selectedReport = await prisma.report.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      });
    }

    if (!selectedReport) {
      return NextResponse.json({ report: null, history });
    }

    return NextResponse.json({ 
      report: JSON.parse(selectedReport.content || "{}"),
      date: selectedReport.date,
      history
    });
  } catch (error) {
    console.error("Fetch report error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // 0. Check settings (Feature Flags and AI Quotas)
    const settingsRows = await (prisma as any).settings.findMany({
      where: { key: { in: ['featureFlags', 'aiSettings'] } }
    });
    const settingsMap = settingsRows.reduce((acc: any, row: any) => {
      try { acc[row.key] = JSON.parse(row.value); } catch(e) { acc[row.key] = row.value; }
      return acc;
    }, {});
    
    const featureFlags = settingsMap.featureFlags || { aiAnalysis: true };
    const aiSettings = settingsMap.aiSettings || { maxReports: 3 };

    if (!featureFlags.aiAnalysis) {
      return NextResponse.json({ error: "AI Analysis feature is currently disabled by the administrator." }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingReportsCount = await prisma.report.count({
      where: {
        userId,
        date: { gte: today },
      },
    });

    if (existingReportsCount >= aiSettings.maxReports) {
      return NextResponse.json({ 
        error: `Daily limit reached. You can only perform ${aiSettings.maxReports} analysis per day.` 
      }, { status: 429 });
    }

    // 1. Fetch user data (Expenses and Incomes)
    const [expenses, incomes, user] = await Promise.all([
      prisma.expense.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.income.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { monthlyLimit: true, expenseMode: true, name: true }
      }),
    ]);

    if (!expenses.length && !incomes.length) {
      return NextResponse.json({ 
        error: "No data found to analyze. Please add some incomes and expenses first." 
      }, { status: 400 });
    }

    // 2. Prepare data (Sanitized - NO CONFIDENTIAL DATA LIKE NAMES/EMAILS)
    const sanitizeNote = sanitizePii;

    const sanitizedIncomes = incomes.map(inc => ({
      amount: inc.amount,
      source: inc.source,
      date: inc.date.toISOString().split("T")[0],
      note: sanitizeNote(inc.note || "")
    }));

    const sanitizedExpenses = expenses.map(exp => ({
      amount: exp.amount,
      category: exp.category,
      subcategory: exp.subcategory,
      date: exp.date.toISOString().split("T")[0],
      note: sanitizeNote(exp.note || "")
    }));

    // V4: Groq provider when enabled — with real token/cost tracking and
    // schema validation. Any failure falls back to the V3 Gemini path below,
    // so flipping GROQ_CHAT_ENABLED off restores exact V3 behavior.
    if (isGroqChatEnabled()) {
      const startedAt = Date.now();
      try {
        const system = buildAnalysisSystemPrompt({
          user: {
            budgetLimit: user?.monthlyLimit ?? null,
            expenseMode: user?.expenseMode ?? null,
          },
          incomes: sanitizedIncomes,
          expenses: sanitizedExpenses,
        });

        const groqResult = await callGroqAnalyze([
          { role: "system", content: system },
          { role: "user", content: "Generate the financial analysis JSON report." },
        ]);

        if (!validateAnalysisReport(groqResult.data)) {
          throw new Error("Invalid analysis JSON from Groq.");
        }

        const promptTokens = groqResult.usage.promptTokens;
        const outputTokens = groqResult.usage.outputTokens;

        await (prisma as any).report.create({
          data: {
            userId,
            content: groqResult.content,
            status: "SUCCESS",
            tokens: promptTokens + outputTokens,
            cost: estimateCostUsd(promptTokens, outputTokens),
          },
        });

        logAiUsage({
          userId,
          callType: "analyze",
          intent: "analysis_report",
          promptTokens,
          outputTokens,
          latencyMs: Date.now() - startedAt,
          fallbackUsed: false,
        });

        return NextResponse.json(groqResult.data);
      } catch (error) {
        console.error("AI Analysis Error (Groq) — falling back to Gemini:", error);
        logAiUsage({
          userId,
          callType: "analyze",
          intent: "analysis_report",
          latencyMs: Date.now() - startedAt,
          fallbackUsed: true,
        });
      }
    }

    // 3. Initialize Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
      return NextResponse.json(
        { error: "AI configuration error. Please check your environment variables." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const prompt = `
      Act as a professional and friendly Senior Financial Advisor. 
      Analyze the provided financial data for the user.
      
      User Context:
      - Monthly Budget Limit: ${user?.monthlyLimit ? `₹${user.monthlyLimit}` : "Not set"}
      - Expense Mode: ${user?.expenseMode || "Standard"}

      Income Data (Last several months):
      ${JSON.stringify(sanitizedIncomes, null, 2)}

      Expense Data (Last several months):
      ${JSON.stringify(sanitizedExpenses, null, 2)}

      Tasks:
      1. Spending Analysis: Provide a forensic summary of spending patterns, identify anomalies, and create metrics (Total spend, Income, Savings, Savings Rate).
      2. Budget Intelligence: Provide smart limit advice based on history, burn rate analysis (projected vs limit), and reallocation tips.
      3. Income Insights: Track the savings rate trend over the months and analyze the income vs expense gap.
      4. Finance Advice: Provide longitudinal advice based on the entire history. specifically focus on Emergency Fund status (suggesting 6 months of expenses if not already met).
      5. Hypothetical Scenario: Include a "What If" analysis (e.g., response to a 25% income dip) with specific spending cuts.
      6. Suggestions: Provide a list of 3-5 concrete, actionable suggestions to save money based on their specific spending habits. For each, specify the category, the suggestion text, and estimated potential monthly savings.

      Output Requirements:
      - Use professional language.
      - DO NOT use the user's name or any identifying information.
      - Ensure the response is a valid JSON object matching the requested schema.
    `;

    // 4. Make request with JSON Schema
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using gemini-1.5-flash for stability
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            spendingAnalysis: {
              type: "object",
              properties: {
                summary: { type: "string" },
                metrics: {
                   type: "array",
                   items: {
                      type: "object",
                      properties: {
                         label: { type: "string" },
                         value: { type: "string" },
                         type: { type: "string", enum: ["danger", "success", "neutral"] }
                      },
                      required: ["label", "value", "type"]
                   }
                },
                anomalies: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["summary", "metrics", "anomalies"]
            },
            budgetIntelligence: {
              type: "object",
              properties: {
                limitAdvice: { type: "string" },
                burnRate: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    status: { type: "string", enum: ["warning", "ok"] }
                  },
                  required: ["message", "status"]
                },
                reallocationTips: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["limitAdvice", "burnRate", "reallocationTips"]
            },
            incomeInsights: {
              type: "object",
              properties: {
                savingsRateTrend: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string" },
                      rate: { type: "string" }
                    },
                    required: ["month", "rate"]
                  }
                },
                gapAnalysis: { type: "string" }
              },
              required: ["savingsRateTrend", "gapAnalysis"]
            },
            financeAdvice: {
              type: "object",
              properties: {
                longTermAdvice: { type: "string" },
                emergencyFundStatus: { type: "string" },
                hypotheticalScenario: {
                   type: "object",
                   properties: {
                      title: { type: "string" },
                      advice: { type: "string" }
                   },
                   required: ["title", "advice"]
                }
              },
              required: ["longTermAdvice", "emergencyFundStatus", "hypotheticalScenario"]
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  suggestion: { type: "string" },
                  potentialSavings: { type: "string" }
                },
                required: ["category", "suggestion", "potentialSavings"]
              }
            }
          },
          required: ["spendingAnalysis", "budgetIntelligence", "incomeInsights", "financeAdvice", "suggestions"]
        }
      }
    });

    const result = response.text;
    if (!result) {
      throw new Error("Empty response from AI model.");
    }

    const reportData = JSON.parse(result);

    // 5. Store the report in database
    await (prisma as any).report.create({
      data: {
        userId,
        content: result,
        status: "SUCCESS",
        tokens: 0, // In a real app, you'd get this from the response
        cost: 0,
      },
    });

    // Parse and return the structured JSON
    return NextResponse.json(reportData);


  } catch (error: any) {
    console.error("AI Analysis Error (Structured Gemini):", error);
    
    // User requested specific error message for limits
    if (error.message?.includes("quota") || error.message?.includes("limit") || error.status === 429) {
      return NextResponse.json(
        { error: "Issue is AI Limit, we will fix it soon" },
        { status: 429 }
      );
    }

    // Specific handling for authentication/credentials issues
    if (error.message?.includes("credentials") || error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "AI authentication failed. Please verify the API key." },
        { status: 500 }
      );
    }

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: isDev ? (error.message || "Something went wrong during financial analysis") : "Something went wrong during financial analysis" },
      { status: 500 }
    );
  }
}

