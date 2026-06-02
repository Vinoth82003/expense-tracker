import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { DocsLayoutClient } from "@/app/docs/DocsLayoutClient";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_session")?.value === "true";

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
