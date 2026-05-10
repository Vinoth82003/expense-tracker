import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id, userId } = params;

    const requester = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    // Must be admin to remove a member, OR the user is removing themselves
    const requesterMember = await (prisma as any).groupMember.findUnique({
      where: { userId_groupId: { userId: requester.id, groupId: id } },
    });

    if (!requesterMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (requesterMember.role !== "ADMIN" && requester.id !== userId) {
      return NextResponse.json({ error: "Forbidden. Admin access required to remove others." }, { status: 403 });
    }

    // You can't remove the last admin if there are other members
    const groupMembers = await (prisma as any).groupMember.findMany({
      where: { groupId: id },
    });

    if (requesterMember.role === "ADMIN" && userId === requester.id) {
      const otherAdmins = groupMembers.filter((m: any) => m.role === "ADMIN" && m.userId !== requester.id);
      if (otherAdmins.length === 0 && groupMembers.length > 1) {
        return NextResponse.json(
          { error: "Cannot leave group. You are the only admin. Please assign another admin first." },
          { status: 400 }
        );
      }
    }

    await (prisma as any).groupMember.delete({
      where: { userId_groupId: { userId, groupId: id } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
