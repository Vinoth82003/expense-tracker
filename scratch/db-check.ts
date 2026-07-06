import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("=== CATEGORIES ===");
  console.log(categories);

  const expenses = await prisma.expense.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log("=== RECENT EXPENSES ===");
  console.log(expenses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
