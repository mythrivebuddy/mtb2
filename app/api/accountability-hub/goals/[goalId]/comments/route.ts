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
          select: { name: true, image: true,id: true },
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
    // ✅ --- FIX: Explicitly type the `text` from req.json() ---
    const { text }: { text: string } = await req.json();

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
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        member: {
          select: {
            groupId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const groupId = goal?.member?.groupId;
    const goalOwnerName = goal?.member?.user?.name;

    if (groupId && session.user.name) {
      // 1. Log the main "comment posted" activity
      const commentLogMessage = goalOwnerName
        ? `${session.user.name} commented on ${goalOwnerName}'s goal.`
        : `${session.user.name} posted a new comment.`;

      await logActivity(
        groupId,
        session.user.id,
        "comment_posted",
        commentLogMessage
      );

      // --- MENTION LOGGING ---
      // 2. Parse the comment text for mentions and log each one
      const mentionRegex = /@(\w+)\b/g;
      const mentions = text.match(mentionRegex) || []; // e.g., ["@Toheed", "@ex1"]

      const uniqueMentions = [...new Set(mentions)];

      if (uniqueMentions.length > 0) {
        // Because `text` is now a `string`, `uniqueMentions` is correctly
        // inferred as `string[]`, and `mention` is inferred as `string`.
        const logPromises = uniqueMentions.map((mention) => {
          const mentionedName = mention.substring(1);

          const logMessage = goalOwnerName
            ? `${session.user.name} mentioned @${mentionedName} in a comment on ${goalOwnerName}'s goal.`
            : `${session.user.name} mentioned @${mentionedName} in a comment.`;

          // Use "comment_posted" as the type, per the previous fix
          return logActivity(
            groupId,
            session.user.id,
            "comment_posted", 
            logMessage
          );
        });

        await Promise.all(logPromises);
      }
      // --- END MENTION LOGGING ---
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