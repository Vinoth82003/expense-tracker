import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getAuthenticatedUserId } from "@/lib/internal-api-auth";

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
export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get cached global categories
    const globalCategories = await getCachedGlobalCategories();

// 2. Get user's custom categories
    const userCategories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    // 3. Which categories this user has chosen to hide (system categories are
    // shared, so the preference lives on the user, not on the Category row).
    const hiddenPrefs = await prisma.userCategoryPreference.findMany({
      where: { userId, hidden: true },
      select: { categoryId: true },
    });
    const hiddenIds = new Set(hiddenPrefs.map((p) => p.categoryId));

    // 4. Merge and deduplicate by name + type
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

    const categories = Array.from(uniqueMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        ...c,
        isSystem: c.userId === null,
        hidden: hiddenIds.has(c.id),
      }));

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
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
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
        userId,
      }
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH and DELETE for a single category live in ./[id]/route.ts, which matches
// the RESTful URLs the client mutations call.
