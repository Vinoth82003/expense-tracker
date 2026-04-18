import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// Helper to check admin auth
async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session && session.value === "true";
}

// GET all global default categories
export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      where: { userId: null, isDefault: true },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch admin categories", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// CREATE a new global default category
export async function POST(req: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, type } = await req.json();
    if (!name || !type) return NextResponse.json({ error: "Name and type are required" }, { status: 400 });

    const newCategory = await prisma.category.create({
      data: {
        name,
        type,
        isDefault: true,
        userId: null
      }
    });
    
    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, name, type } = await req.json();
    if (!id || !name || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, type }
    });

    return NextResponse.json({ category: updatedCategory }, { status: 200 });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
