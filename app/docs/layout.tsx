import { prisma } from "@/lib/prisma";
import { DocsLayoutClient } from "@/app/docs/DocsLayoutClient";
import { verifyAdminSession } from "@/lib/admin-auth";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await verifyAdminSession();

  let whereClause: any = {};
  if (!isAdmin) {
    whereClause.status = "PUBLISHED";
  }

  const docs = await prisma.doc.findMany({
    where: whereClause,
    orderBy: { order: "asc" }
  });

  // Serialize dates to avoid serialization errors during Server-to-Client boundary transition
  const serializedDocs = docs.map(doc => ({
    ...doc,
    createdAt: doc.createdAt?.toISOString() || null,
    updatedAt: doc.updatedAt?.toISOString() || null,
  }));

  return (
    <DocsLayoutClient docs={serializedDocs as any}>
      {children}
    </DocsLayoutClient>
  );
}
