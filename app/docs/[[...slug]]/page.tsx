import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DocsPageClient } from "@/app/docs/[[...slug]]/DocsPageClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

async function getDocData(slugParam?: string[]) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_session")?.value === "true";

  let whereClause: any = {};
  if (!isAdmin) {
    whereClause.status = "PUBLISHED";
  }

  const allDocs = await prisma.doc.findMany({
    where: whereClause,
    orderBy: { order: "asc" }
  });

  const activeSlug = slugParam && slugParam.length > 0 ? slugParam[0] : null;

  let selectedDoc = null;
  if (activeSlug) {
    selectedDoc = allDocs.find(d => d.slug === activeSlug) || null;
  } else if (allDocs.length > 0) {
    selectedDoc = allDocs[0];
  }

  return {
    allDocs,
    selectedDoc,
    activeSlug
  };
}

function stripMarkdown(md: string): string {
  if (!md) return "";
  let text = md;
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/^\s*#+\s+/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/^\s*>\s+/gm, "");
  text = text.replace(/[*_~]+/g, "");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { selectedDoc } = await getDocData(slug);

  if (!selectedDoc) {
    return {
      title: "Doc Not Found | SpendWise Docs",
      description: "The requested documentation page could not be found."
    };
  }

  const cleanDescription = stripMarkdown(selectedDoc.content);
  const plainText = cleanDescription.length > 160 
    ? cleanDescription.substring(0, 157) + "..."
    : cleanDescription;

  return {
    title: `${selectedDoc.title} | SpendWise Docs`,
    description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
    openGraph: {
      title: `${selectedDoc.title} | SpendWise Docs`,
      description: plainText || `Read about ${selectedDoc.title} in the SpendWise documentation.`,
      type: "article",
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const { allDocs, selectedDoc, activeSlug } = await getDocData(slug);

  // If visiting /docs directly and we have a first doc, redirect to /docs/[first-slug]
  if (!activeSlug && selectedDoc) {
    redirect(`/docs/${selectedDoc.slug}`);
  }

  const serializedSelectedDoc = selectedDoc ? {
    ...selectedDoc,
    createdAt: selectedDoc.createdAt?.toISOString() || null,
    updatedAt: selectedDoc.updatedAt?.toISOString() || null,
  } : null;

  const serializedAllDocs = allDocs.map(d => ({
    ...d,
    createdAt: d.createdAt?.toISOString() || null,
    updatedAt: d.updatedAt?.toISOString() || null,
  }));

  return (
    <DocsPageClient 
      selectedDoc={serializedSelectedDoc as any} 
      allDocs={serializedAllDocs as any} 
    />
  );
}
