import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all approved reviews for home page
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST new review (authenticated users)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating, comment } = await request.json();

    if (rating === undefined || !comment) {
      return NextResponse.json({ error: "Rating and comment are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a review
    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id }
    });

    if (existingReview) {
      // Update existing review instead of creating new one
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: Number(rating),
          comment,
          status: "PENDING" // Reset to pending on update
        }
      });
      return NextResponse.json(updatedReview);
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        userId: user.id,
        status: "PENDING"
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

