import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title, content, category, slug, order } = await req.json();
    
    const doc = await prisma.doc.update({
      where: { id },
      data: { title, content, category, slug, order: parseInt(order) || 0 }
    });
    
    return NextResponse.json(doc, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update doc" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.doc.delete({
      where: { id }
    });
    return NextResponse.json({ message: "Doc deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete doc" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
