import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const members = await (prisma as any).groupMember.findMany({
      where: { groupId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Verify if the requester is in the list of members
    const isMember = members.some((m: any) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    const requester = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    const group = await (prisma as any).group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const requesterMember = await (prisma as any).groupMember.findUnique({
      where: { userId_groupId: { userId: requester.id, groupId: id } },
    });

    if (!requesterMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // See if the user exists
    let targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    // For now, if the user does not exist, we just return an error or we could send an email invite.
    // The spec says "Or search users by name to get their email". Assuming they must be registered, or we send an invite.
    if (!targetUser) {
      return NextResponse.json({ error: "User not found in the system. They need to register first." }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await (prisma as any).groupMember.findUnique({
      where: { userId_groupId: { userId: targetUser.id, groupId: id } },
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    // Create the member as PENDING, and we can generate an invitation.
    const newMember = await (prisma as any).groupMember.create({
      data: {
        userId: targetUser.id,
        groupId: id,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // We can also create an Invitation record here if needed.
    
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
