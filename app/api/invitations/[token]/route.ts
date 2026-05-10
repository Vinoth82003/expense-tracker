import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { token } = params;

    const invitation = await (prisma as any).invitation.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            creator: { select: { name: true, email: true } },
            members: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation already processed" }, { status: 400 });
    }

    return NextResponse.json({
      groupName: invitation.group.name,
      creatorName: invitation.group.creator.name || invitation.group.creator.email,
      memberCount: invitation.group.members.length,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const params = await context.params;
    const { token } = params;
    const { decision } = await req.json(); // 'accept' or 'decline'

    const invitation = await (prisma as any).invitation.findUnique({
      where: { token },
      include: { group: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (decision === "decline") {
      await (prisma as any).invitation.update({
        where: { token },
        data: { status: "DECLINED" },
      });
      return NextResponse.json({ success: true, message: "Invitation declined" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Process acceptance
    await prisma.$transaction([
      (prisma as any).invitation.update({
        where: { token },
        data: { status: "ACCEPTED" },
      }),
      (prisma as any).groupMember.upsert({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: invitation.groupId,
          },
        },
        update: { status: "ACCEPTED" },
        create: {
          userId: user.id,
          groupId: invitation.groupId,
          status: "ACCEPTED",
          role: "MEMBER",
        },
      }),
    ]);

    return NextResponse.json({ success: true, groupId: invitation.groupId });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
