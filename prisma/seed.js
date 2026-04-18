const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial data...");

  // Seed FAQ
  const faqs = [
    {
      question: "Is SpendWise free to use?",
      answer: "Yes, SpendWise is completely free for personal use. We believe everyone deserves access to high-quality financial tracking without paywalls or hidden subscriptions.",
      category: "General",
      order: 1
    },
    {
      question: "How do I get started?",
      answer: "Simply sign in with your Google account. No complex registration or email verification required—you'll be tracking your first expense in under 30 seconds.",
      category: "General",
      order: 2
    },
    {
      question: "How secure is my financial data?",
      answer: "Extremely. We use industry-standard encryption and secure OAuth 2.0 via Google. We never see or store your passwords, and your data is stored behind multiple layers of security.",
      category: "Security & Privacy",
      order: 1
    },
    {
      question: "What is AI Forensic Analysis?",
      answer: "Our proprietary AI analyzes your spending patterns to find 'leaks' (wasteful spending) and provides data-driven advice to help you reach your goals faster.",
      category: "Features & Support",
      order: 1
    }
  ];

  for (const faq of faqs) {
    await prisma.fAQ.upsert({
      where: { id: "000000000000000000000000" }, // Dummy to always trigger create if not exact
      update: {},
      create: faq
    }).catch(() => {
        // Fallback for upsert on non-existent ID in MongoDB
        return prisma.fAQ.create({ data: faq });
    });
  }

  // Seed Documentation
  const docs = [
    {
      title: "Getting Started",
      category: "Basics",
      slug: "getting-started",
      content: "# Welcome to SpendWise\nSpendWise is your companion for financial clarity and growth. This guide will help you set up your account and start tracking your expenses effectively.\n\n## Step 1: Sign in\nUse your Google account to log in securely.\n\n## Step 2: Set your Budget\nNavigate to your profile and set a monthly spending limit.",
      order: 1
    },
    {
      title: "Category Insights",
      category: "Features",
      slug: "category-insights",
      content: "# Understanding your Spending\nWe categorize your spending into three main buckets:\n\n1. **Needs**: Essential survival expenses (Rent, Food, Utilities).\n2. **Wants**: Lifestyle and entertainment expenses.\n3. **Savings**: Investments and debt payments.",
      order: 2
    }
  ];

  for (const doc of docs) {
    await prisma.doc.upsert({
      where: { slug: doc.slug },
      update: {},
      create: doc
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
