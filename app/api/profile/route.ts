import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorNotification } from "@/lib/api-error-handler";

export const PATCH = withErrorNotification(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { name },
  });

  return NextResponse.json(updatedUser);
}, "PATCH");
