import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Initializing feedback counters...");
  const result = await prisma.doc.updateMany({
    data: {
      helpfulCount: 0,
      notHelpfulCount: 0
    }
  });
  console.log(`Initialized ${result.count} documents.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
