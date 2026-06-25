import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const isAdmin = await verifyAdminSession();

    let whereClause: any = {};
    if (!isAdmin) {
      whereClause.status = "PUBLISHED";
    }

    const docs = await prisma.doc.findMany({
      where: whereClause,
      orderBy: { order: "asc" }
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

    const existingDoc = await prisma.doc.findUnique({
      where: { slug }
    });

    if (existingDoc) {
      return NextResponse.json({ message: "A document with this URL slug already exists" }, { status: 409 });
    }

    const doc = await prisma.doc.create({
      data: { 
        title, 
        content, 
        category, 
        slug, 
        order: parseInt(order) || 0,
        status: status || "DRAFT",
        contentType: contentType || "MARKDOWN"
      } as any
    });
    
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Doc creation error:", error);
    return NextResponse.json({ message: "Failed to create doc" }, { status: 500 });
  }
}
