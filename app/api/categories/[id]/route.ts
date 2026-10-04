import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/internal-api-auth";
import { validateOrigin } from "@/lib/csrf";

/**
 * PATCH /api/categories/[id] — rename or re-type a user's own custom category.
 *
 * System categories (userId === null) are shared by every account, so they are
 * intentionally not editable here; use PUT /api/categories/[id]/visibility to
 * hide one for yourself.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfCheck = validateOrigin(req);
  if (csrfCheck) return csrfCheck;

  try {
    const { id } = await params;
    const { name, type } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (category.userId !== userId || category.isDefault) {
      return NextResponse.json(
        { error: "Forbidden: Cannot edit system categories" },
        { status: 403 }
      );
    }

    // Reject a rename that would collide with a different existing category,
    // otherwise the merged GET response would silently drop one of the pair.
    const duplicate = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        type,
        id: { not: id },
        OR: [{ userId: null, isDefault: true }, { userId }],
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A category with that name already exists" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, type },
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/categories/[id] — remove one of the user's own custom categories. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfCheck = validateOrigin(req);
  if (csrfCheck) return csrfCheck;

  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (category.userId !== userId || category.isDefault) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete system categories" },
        { status: 403 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}