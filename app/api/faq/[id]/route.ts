import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { question, answer, category, order } = await req.json();
    
    const faq = await prisma.fAQ.update({
      where: { id },
      data: { question, answer, category, order: parseInt(order) || 0 }
    });
    
    return NextResponse.json(faq, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update FAQ" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.fAQ.delete({
      where: { id }
    });
    return NextResponse.json({ message: "FAQ deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete FAQ" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
