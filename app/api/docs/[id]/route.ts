import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_session")?.value;

    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, content, category, slug, order, status, contentType } = await req.json();
    
    try {
      const doc = await prisma.doc.update({
        where: { id },
        data: { 
          title, 
          content, 
          category, 
          slug, 
          order: parseInt(order) || 0,
          status,
          contentType
        } as any
      });
      
      return NextResponse.json(doc, { status: 200 });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ message: "A document with this URL slug already exists" }, { status: 409 });
      }
      return NextResponse.json({ message: "Failed to update doc" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_session")?.value;

    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.doc.delete({
      where: { id }
    });
    return NextResponse.json({ message: "Doc deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete doc" }, { status: 500 });
  }
}
