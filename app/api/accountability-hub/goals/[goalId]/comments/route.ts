// app/api/accountability-hub/goals/[goalId]/comments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

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
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
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
        content: text, // Assuming your schema uses 'content' for the comment body
        goalId: goalId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { name: true, image: true },
        },
      },
    });

    // Log the activity after successfully creating the comment.
    // ✅ CORRECTED: Fetch the groupId through the Goal's 'member' relation.
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        member: { // Traverse through the member relation...
          select: {
            groupId: true // ...to get the groupId.
          }
        }
      }
    });

    // ✅ CORRECTED: Access the groupId from the nested object and use optional chaining for safety.
    const groupId = goal?.member?.groupId;
    if (groupId && session.user.name) {
      await logActivity(
        groupId,
        session.user.id,
        'comment_posted', // FIX: Use a valid activity type from your enum
        `${session.user.name} posted a new comment.`
      );
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(`[POST_COMMENT]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

