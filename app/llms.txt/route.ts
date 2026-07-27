import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_LINK || process.env.NEXTAUTH_URL || "https://money-spend-tracker.vercel.app";

  // 1. High-level Summary
  const header = `# SpendWise\n\n> SpendWise is a modern, premium personal finance and budget manager designed for Indian users. It supports Rupee-native expense tracking, budgeting, category insights (categorizing expenses into Needs and Wants), AI forensic analysis, offline PWA capability, and shared group expense splitting.\n\n`;

  // 2. Key Features
  const features = `## Key Features\n\n- **Rupee-First Expense Tracking**: Log daily expenses quickly with custom descriptions, categories (Needs vs. Wants), subcategories, and attachment uploads.\n- **Budgeting & Alerts**: Define monthly spend boundaries and receive intelligent alerts when threshold limits are breached.\n- **Bento Dashboard Analytics**: Clear interactive charts and breakdowns visualizing expense structures and cash flows.\n- **AI Forensic Analysis**: Automated reports analyzing your transactions to highlight saving zones and wasteful spending.\n- **Group Expense Splitting**: Set up groups, invite roommates/friends, log joint expenses, and calculate optimal settlement balances instantly.\n- **Progressive Web App (PWA)**: Works completely offline with automated local storage caching and server syncing when connectivity resumes.\n\n`;

  // 3. Public Routes Index
  const directories = `## Public Pages Directory\n\n- [Home Page](${baseUrl}): Main landing page detailing the features and setup.\n- [Features Page](${baseUrl}/features): Detailed review of all app capabilities.\n- [How It Works](${baseUrl}/how-it-works): Tutorial on onboarding, budget setup, and PWA installation.\n- [FAQs Page](${baseUrl}/faq): Frequently asked questions on security, pricing, and exports.\n- [Contact Page](${baseUrl}/contact): Feedback submission and customer support.\n- [Status Page](${baseUrl}/status): Real-time application system status and health indicator.\n- [Privacy Policy](${baseUrl}/privacy): Details on data protection and user privacy rights.\n- [Terms of Service](${baseUrl}/terms): Usage terms and legal agreements.\n- [Sitemap](${baseUrl}/sitemap.xml): Search engine index file.\n\n`;

  // 4. Dynamic Documentation
  let docsContent = "## Product Documentation & Guides\n\n";
  try {
    const publishedDocs = await prisma.doc.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        order: "asc",
      },
    });

    if (publishedDocs.length > 0) {
      publishedDocs.forEach((doc) => {
        // Strip markdown elements for a clean snippet
        const cleanContent = doc.content
          .replace(/[#*`_\-]/g, "")
          .replace(/<[^>]*>/g, "")
          .substring(0, 120)
          .replace(/\s+/g, " ")
          .trim();
        docsContent += `- [${doc.title}](${baseUrl}/docs/${doc.slug}): ${cleanContent}...\n`;
      });
    } else {
      docsContent += "- *No documentation articles currently published.*\n";
    }
  } catch (error) {
    console.error("Error loading docs for llms.txt:", error);
    docsContent += "- *Error retrieving current database documentation articles.*\n";
  }
  docsContent += "\n";

  // 5. API Reference
  const apiReference = `## Developer & API Integration Guide

SpendWise exposes a RESTful API. All private routes require OAuth session authentication (NextAuth).

### Authentication
- Authentication is handled via session cookies.
- All non-public API calls must possess a valid authenticated session.
- Client-provided \`userId\` fields are ignored; endpoints enforce scoping based on session-bound user IDs.

### Primary API Endpoints

#### User Management
- \`GET /api/user/me\`: Fetches authenticated user profile, limit settings, and currency.
- \`PATCH /api/user/settings\`: Updates \`expenseMode\`, \`monthlyLimit\`, and currency details.

#### Expenses API
- \`POST /api/expenses\`: Logs a new expense (JSON body: \`amount\`, \`categoryType\`, \`subcategory\`, \`title\`, \`note\`, \`expenseDate\`).
- \`GET /api/expenses\`: Returns paginated user expenses. Supports filters: \`page\`, \`limit\`, \`categoryType\`, \`startDate\`, \`endDate\`, \`search\`.
- \`GET /api/expenses/:id\`: Fetches details of a single expense.
- \`PATCH /api/expenses/:id\`: Updates details of an expense.
- \`DELETE /api/expenses/:id\`: Deletes a logged expense.

#### Categories API
- \`GET /api/categories\`: Fetches available categories divided by Needs/Wants.
- \`POST /api/categories\`: Adds a custom user category.

#### Income API
- \`POST /api/income\`: Adds an income transaction.
- \`GET /api/income\`: Lists income history.

#### Reports & Dashboard API
- \`GET /api/dashboard\`: Returns key KPIs: current monthly spending, balance, and limits.
- \`GET /api/reports/monthly?month=YYYY-MM\`: Provides structured monthly insights and category breakdowns.

#### System Utilities
- \`GET /api/health\`: Returns standard health state \`{"status": "ok"}\`.
`;

  const fullText = `${header}${features}${directories}${docsContent}${apiReference}`;

  return new NextResponse(fullText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
