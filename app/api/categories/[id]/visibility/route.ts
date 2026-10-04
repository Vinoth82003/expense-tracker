import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/internal-api-auth";
import { validateOrigin } from "@/lib/csrf";

/**
 * PUT /api/categories/[id]/visibility — hide or unhide a system category.
 *
 * This is a personal preference, so it is stored per user rather than as a flag
 * on the shared Category row: flipping a flag there would hide the category for
 * every account on the platform.
 *
 * Only system categories (`userId === null`) accept a visibility change. A user's
 * own custom categories are edited or deleted outright, so accepting `hidden`
 * for them would create a state the settings UI cannot surface or undo.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfCheck = validateOrigin(req);
  if (csrfCheck) return csrfCheck;

  try {
    const { id } = await params;
    const { hidden } = await req.json();
    if (typeof hidden !== "boolean") {
      return NextResponse.json({ error: "hidden must be a boolean" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (category.userId !== null) {
      return NextResponse.json(
        { error: "Only system categories can be hidden" },
        { status: 403 }
      );
    }

    if (hidden) {
      await prisma.userCategoryPreference.upsert({
        where: { userId_categoryId: { userId, categoryId: id } },
        update: { hidden: true },
        create: { userId, categoryId: id, hidden: true },
      });
    } else {
      // Unhiding clears the preference rather than storing hidden:false, so the
      // row disappears entirely once no preference remains.
      await prisma.userCategoryPreference.deleteMany({
        where: { userId, categoryId: id },
      });
    }

    return NextResponse.json({ success: true, id, hidden });
  } catch (error) {
    console.error("Failed to update category visibility", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}