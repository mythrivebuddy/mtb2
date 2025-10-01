// app/api/accountability-hub/goals/[goalId]/comments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET handler to fetch all comments for a goal
export async function GET(
  _req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = params;

    const comments = await prisma.comment.findMany({
      where: { goalId: goalId },
      include: {
        author: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(`[GET_COMMENTS]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST handler to create a new comment
export async function POST(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = params;
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        text: text, // <-- THIS IS THE FIX (was 'content')
        goalId: goalId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { name: true, image: true },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(`[POST_COMMENT]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}