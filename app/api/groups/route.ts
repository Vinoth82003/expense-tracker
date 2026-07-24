import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorNotification } from "@/lib/api-error-handler";

export const GET = withErrorNotification(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const groups = await (prisma as any).group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
          status: "ACCEPTED"
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}, "GET");

export const POST = withErrorNotification(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { name, description } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  const group = await (prisma as any).group.create({
    data: {
      name,
      description,
      createdBy: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
          status: "ACCEPTED",
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}, "POST");
