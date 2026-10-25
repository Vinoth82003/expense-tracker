import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { normalizeSlug, isValidSlug } from "@/lib/slug";

export async function GET() {
  try {
    const isAdmin = await verifyAdminSession();

    let whereClause: any = {};
    if (!isAdmin) {
      // Drafts must never leak through the public API.
      whereClause.status = "PUBLISHED";
    }

    const docs = await prisma.doc.findMany({
      where: whereClause,
      // Deterministic ordering: position first, then a stable tiebreak so two
      // documents sharing a position do not swap between requests.
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(docs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch docs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await verifyAdminSession();

    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, content, category, slug, order, status, contentType } = await req.json();

    if (!title || !content || !category || !slug) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Normalize + validate the slug so casing/whitespace variants collide.
    const normalizedSlug = normalizeSlug(slug);
    if (!isValidSlug(normalizedSlug)) {
      return NextResponse.json(
        { message: "Invalid slug. Use lowercase letters, numbers, hyphens and slashes." },
        { status: 400 }
      );
    }

    const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    const validFormats = ["MARKDOWN", "HTML"];
    const resolvedStatus = validStatuses.includes(status) ? status : "DRAFT";
    const resolvedFormat = validFormats.includes(contentType) ? contentType : "MARKDOWN";
    const resolvedOrder = Number.isFinite(parseInt(order, 10)) ? parseInt(order, 10) : 0;

    const existingDoc = await prisma.doc.findUnique({
      where: { slug: normalizedSlug },
    });

    if (existingDoc) {
      return NextResponse.json({ message: "A document with this URL slug already exists" }, { status: 409 });
    }

    const doc = await prisma.doc.create({
      data: {
        title,
        content,
        category,
        slug: normalizedSlug,
        order: resolvedOrder,
        status: resolvedStatus,
        contentType: resolvedFormat,
      } as any,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    // Unique-constraint race between the check above and the insert.
    if (error?.code === "P2002") {
      return NextResponse.json({ message: "A document with this URL slug already exists" }, { status: 409 });
    }
    console.error("Doc creation error:", error);
    return NextResponse.json({ message: "Failed to create doc" }, { status: 500 });
  }
}
