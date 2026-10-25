import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { normalizeSlug, isValidSlug } from "@/lib/slug";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession();

    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, content, category, slug, order, status, contentType } = await req.json();

    if (!title || !content || !category || !slug) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

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

    try {
      const doc = await prisma.doc.update({
        where: { id },
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

      return NextResponse.json(doc, { status: 200 });
    } catch (error: any) {
      if (error.code === "P2002") {
        return NextResponse.json({ message: "A document with this URL slug already exists" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ message: "Document not found" }, { status: 404 });
      }
      console.error("Doc update error:", error);
      return NextResponse.json({ message: "Failed to update doc" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession();

    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    try {
      await prisma.doc.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "Document not found" }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json({ message: "Doc deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete doc" }, { status: 500 });
  }
}
