import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tag } = await req.json();
    
    if (tag) {
      revalidateTag(tag, "max");
      return NextResponse.json({ message: `Cache tag '${tag}' invalidated successfully` });
    } else {
      // If no tag provided, maybe invalidate a default or return error
      return NextResponse.json({ error: "Tag is required" }, { status: 400 });
    }
  } catch (error) {
    console.error("Cache invalidation failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
