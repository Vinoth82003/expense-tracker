import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json(faqs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch FAQs" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: Request) {
  try {
    const { question, answer, category, order } = await req.json();
    const faq = await prisma.fAQ.create({
      data: { question, answer, category, order: parseInt(order) || 0 }
    });
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create FAQ" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
