import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { helpful } = await req.json();

    const updateData = helpful 
      ? { helpfulCount: { increment: 1 } } 
      : { notHelpfulCount: { increment: 1 } };

    const doc = await prisma.doc.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, doc }, { status: 200 });
  } catch (error) {
    console.error("Feedback failed", error);
    return NextResponse.json({ message: "Failed to submit feedback" }, { status: 500 });
  }
}
