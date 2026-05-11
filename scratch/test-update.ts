import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const id = "69e3d0d23f132009bfe67f0f"; // Getting Started
  console.log("Updating document...");
  const updated = await prisma.doc.update({
    where: { id },
    data: {
      helpfulCount: { increment: 1 }
    }
  });
  console.log("Updated result:", JSON.stringify(updated, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
