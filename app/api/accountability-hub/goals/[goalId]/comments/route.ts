// app/api/accountability-hub/goals/[goalId]/comments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // <-- CORRECT AUTH IMPORT
import { authOptions } from "@/lib/auth"; // <-- CORRECT AUTH IMPORT
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";


// GET handler to fetch all comments for a goal
export async function GET(
  _req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    // --- CORRECT AUTH LOGIC ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;

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
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST handler to create a new comment
export async function POST(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    // --- CORRECT AUTH LOGIC ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        content: text,
        goalId: goalId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { name: true, image: true },
        },
      },
    });

    const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { groupId: true } });
    if (goal && goal.groupId) {
      await logActivity(
        goal.groupId,
        'comment_posted',
        `${session.user.name} posted a new comment.`,
        session.user.id
      );
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(`[POST_COMMENT]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}