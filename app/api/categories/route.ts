import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Helper to get global categories with Next.js caching
const getCachedGlobalCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { userId: null, isDefault: true },
      orderBy: { name: "asc" },
    });
  },
  ['global-categories'],
  { revalidate: 300, tags: ['global-categories'] }
);

// GET - Fetch merged categories (global + user-custom)
export async function GET() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Get cached global categories
    const globalCategories = await getCachedGlobalCategories();

    // 2. Get user's custom categories
    const userCategories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });

    // 3. Merge and deduplicate by name + type
    const combined = [...globalCategories, ...userCategories];
    
    // Deduplication via Map using a composite key
    const uniqueMap = new Map();
    combined.forEach(cat => {
      const key = `${cat.type}-${cat.name.toLowerCase()}`;
      if (!uniqueMap.has(key)) {
         uniqueMap.set(key, cat);
      } else {
         // If there's a duplicate, we prioritize the global one
         const existing = uniqueMap.get(key);
         if (!existing.isDefault && cat.isDefault) {
            uniqueMap.set(key, cat); // overwrite with global
         }
      }
    });

    const categories = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'private, max-age=60' // Client-side cache for 60s
      }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create user-custom category
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { name, type } = await req.json();
    if (!name || (type !== 'Needs' && type !== 'Wants')) {
      return NextResponse.json({ error: "Invalid name or type" }, { status: 400 });
    }

    // Check against global to prevent confusion
    const globalCategories = await getCachedGlobalCategories();
    const isGlobalParams = globalCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type);
    if (isGlobalParams) {
      return NextResponse.json({ error: "This is already a system category" }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        type,
        isDefault: false,
        userId: user.id,
      }
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update user-custom category
export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id, name, type } = await req.json();
    if (!id || !name || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (category.userId !== user.id || category.isDefault) {
      return NextResponse.json({ error: "Forbidden: Cannot edit default categories" }, { status: 403 });
    }

    const globalCategories = await getCachedGlobalCategories();
    const isGlobalParams = globalCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type && c.id !== id);
    if (isGlobalParams) {
      return NextResponse.json({ error: "This is already a system category" }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, type }
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete user-custom category
export async function DELETE(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (category.userId !== user.id || category.isDefault) {
      return NextResponse.json({ error: "Forbidden: Cannot delete default categories" }, { status: 403 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
