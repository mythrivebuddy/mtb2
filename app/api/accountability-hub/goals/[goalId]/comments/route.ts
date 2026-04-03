import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import {
  sendPushNotificationMultipleUsers,
  sendPushNotificationToUser,
} from "@/lib/utils/pushNotifications";

// GET handler to fetch all comments for a goal
export async function GET(
  _req: Request,
  { params }: { params: { goalId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;

    const comments = await prisma.comment.findMany({
      where: {
        goalId: goalId,
        parentId: null,
      },
      include: {
        author: {
          select: { name: true, image: true, id: true },
        },
        replies: {
  include: {
    author: {
      select: { name: true, image: true, id: true },
    },
  },
  orderBy: { createdAt: "asc" },
},
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(`[GET_COMMENTS]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { goalId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;
    // ✅ --- FIX: Explicitly type the `text` from req.json() ---
    const { text, parentId }: { text: string; parentId?: string } =
      await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 },
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        content: text, // Assuming your schema uses 'content' for the comment body
        goalId: goalId,
        authorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { name: true, image: true },
        },
      },
    });

    let parentCommentAuthorId: string | null = null;

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });

      parentCommentAuthorId = parentComment?.authorId || null;
    }

    // Log the activity after successfully creating the comment.
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        member: {
          select: {
            groupId: true,
            user: {
              select: {
                id: true,
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
      const commentLogMessage = parentId
        ? `${session.user.name} replied to a comment.`
        : goalOwnerName
          ? `${session.user.name} commented on ${goalOwnerName}'s goal.`
          : `${session.user.name} posted a new comment.`;

      await logActivity(
        groupId,
        session.user.id,
        "comment_posted",
        commentLogMessage,
      );

      // --- MENTION LOGGING ---
      // 2. Parse the comment text for mentions and log each one
      const mentionRegex = /@([a-zA-Z0-9]+(?: [a-zA-Z0-9]+){0,3})/g;
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
            logMessage,
          );
        });

        await Promise.all(logPromises);
      }
      // --- END MENTION LOGGING ---
    }
    // --- GET MENTIONED USER IDs ---
    const mentionRegex = /@([a-zA-Z0-9]+(?: [a-zA-Z0-9]+){0,3})/g;
    const mentions = text.match(mentionRegex) || [];

    const uniqueMentions = [...new Set(mentions)];
    const mentionedUserIds: string[] = [];

    for (const mention of uniqueMentions) {
      const mentionedName = mention.substring(1).trim();

      const user = await prisma.user.findFirst({
        where: {
          name: {
            equals: mentionedName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (user && user.id !== session.user.id) {
        mentionedUserIds.push(user.id);
      }
    }

    // --- PUSH NOTIFICATIONS ---
    // --- PUSH NOTIFICATIONS ---
    const usersToNotify = new Set<string>();

    // Reply → notify parent comment author
    if (parentCommentAuthorId && parentCommentAuthorId !== session.user.id) {
      usersToNotify.add(parentCommentAuthorId);
    }

    // Mentions → notify mentioned users
    mentionedUserIds.forEach((id) => {
      if (id !== session.user.id) {
        usersToNotify.add(id);
      }
    });

    // New comment → notify goal owner
    if (!parentId && goal?.member?.user.id) {
      if (goal.member.user.id !== session.user.id) {
        usersToNotify.add(goal.member.user.id);
      }
    }

    // Send push to all
    usersToNotify.delete(session.user.id);
    if (usersToNotify.size > 0) {
      let title = "New Comment";
      let body = `${session.user.name} commented on a goal.`;

      // Decide notification type per user
      if (parentId) {
        title = "New Reply";
        body = `${session.user.name} replied to your comment.`;
      }

      if (mentionedUserIds.length > 0) {
        title = "You were mentioned";
        body = `${session.user.name} mentioned you in a comment.`;
      }
      void sendPushNotificationMultipleUsers(
        Array.from(usersToNotify),
        title,
        body,
        {
          url: `/dashboard/accountability-hub?goalId=${goalId}`,
        },
      );
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(`[POST_COMMENT]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
