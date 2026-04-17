import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
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

    // 2. Prepare data (Sanitized)
    const sanitizedIncomes = incomes.map(inc => ({
      amount: inc.amount,
      source: inc.source,
      date: inc.date.toISOString().split("T")[0],
      note: inc.note || ""
    }));

    const sanitizedExpenses = expenses.map(exp => ({
      amount: exp.amount,
      category: exp.category,
      subcategory: exp.subcategory,
      date: exp.date.toISOString().split("T")[0],
      note: exp.note || ""
    }));

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
      Analyze the provided financial data for a user named ${user?.name || "User"}.
      
      User Context:
      - Monthly Budget Limit: ${user?.monthlyLimit ? `₹${user.monthlyLimit}` : "Not set"}
      - Expense Mode: ${user?.expenseMode || "Standard"}

      Income Data:
      ${JSON.stringify(sanitizedIncomes, null, 2)}

      Expense Data:
      ${JSON.stringify(sanitizedExpenses, null, 2)}

      Tasks:
      1. Provide a comprehensive summary of their financial health.
      2. Analyze spending patterns by category and subcategory.
      3. Identify at least 3-5 specific warnings or red flags.
      4. identifying 5-7 actionable suggestions to improve their financial discipline.
      5. Create a personalized savings plan based on their goal (or default to 20% savings).

      Output Requirements:
      - Use professional but easy-to-understand language.
      - Ensure the response is a valid JSON object matching the requested schema.
    `;

    // 4. Make request with JSON Schema
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            warnings: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: {
              type: "array",
              items: { type: "string" }
            },
            savingsPlan: { type: "string" }
          },
          required: ["summary", "warnings", "suggestions", "savingsPlan"]
        }
      }
    });

    const result = response.text;
    if (!result) {
      throw new Error("Empty response from AI model.");
    }

    // Parse and return the structured JSON
    return NextResponse.json(JSON.parse(result));

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

    return NextResponse.json(
      { error: "Something went wrong during financial analysis" },
      { status: 500 }
    );
  }
}
