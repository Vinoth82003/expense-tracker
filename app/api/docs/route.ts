import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const docs = await prisma.doc.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json(docs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch docs" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: Request) {
  try {
    const { title, content, category, slug, order } = await req.json();
    const doc = await prisma.doc.create({
      data: { title, content, category, slug, order: parseInt(order) || 0 }
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create doc" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
