import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushNotificationMultipleUsers } from "@/lib/utils/pushNotifications";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";

// PATCH /api/groups/:groupId/notes
export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const { notes, mentionedUserIds = [], everyone = false } = await req.json();

    if (!notes && notes !== "") {
      return NextResponse.json(
        { error: "Notes field is required" },
        { status: 400 },
      );
    }

    // Check if user is a member or admin of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some((m) => m.userId === session.user.id);

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    // Only Admins can update notes
    const memberRole = group.members.find(
      (m) => m.userId === session.user.id,
    )?.role;

    if (memberRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update notes" },
        { status: 403 },
      );
    }

    // Update notes
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { notes },
      select: {
        id: true,
        name: true,
        notes: true,
        updatedAt: true,
      },
    });
    // Get all group member IDs except the admin who edited
    const allMemberIds = group.members
      .map((m) => m.userId)
      .filter((id) => id !== session.user.id);

    let userIdsToNotify: string[] = [];

    // Decide recipients
    if (everyone) {
      userIdsToNotify = allMemberIds;
    } else if (mentionedUserIds.length > 0) {
      userIdsToNotify = mentionedUserIds.filter(
        (id: string) => id !== session.user.id,
      );
    } else {
      userIdsToNotify = allMemberIds;
    }
    userIdsToNotify = [...new Set(userIdsToNotify)];
    void sendPushNotificationMultipleUsers(
      userIdsToNotify,
      `New note in ${group.name}`,
      `${session.user.name} updated group notes`,
      {
        url: `/dashboard/accountability?groupId=${groupId}`,
      },
    );
    void (async () => {
      try {
        // Get users email + name
        const users = await prisma.user.findMany({
          where: { id: { in: userIdsToNotify } },
          select: { id: true, email: true, name: true },
        });

        // Send emails using template
        await Promise.allSettled(
          users.map((user) =>
            sendEmailUsingTemplate({
              toEmail: user.email!,
              toName: user.name || "User",
              templateId: "accountability-group-notes-updated",
              templateData: {
                username: user.name || "User",
                updatedBy: session.user.name,
                groupName: group.name,
                groupUrl: `${process.env.NEXTAUTH_URL}/dashboard/accountability?groupId=${groupId}`,
              },
            }),
          ),
        );
      } catch (err) {
        console.error("Email sending error:", err);
      }
    })();

    return NextResponse.json(
      {
        message: "Notes updated successfully",
        group: updatedGroup,
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating notes:", error);
    return NextResponse.json(
      { error: "Failed to update notes" },
      { status: 500 },
    );
  }
}

// Delete the group
// /api/accountability-hub/groups/[groupId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const { groupId } = await params;
    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 },
      );
    }
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json(
        { message: "No group found to delete" },
        { status: 404 },
      );
    }

    const isAdmin = userRole === "ADMIN";
    const isCreator = group.creatorId === userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You are not allowed to delete this group" },
        { status: 403 },
      );
    }

    // Delete group — cascade will handle related records
    await prisma.group.delete({ where: { id: groupId } });

    return NextResponse.json(
      { message: "Group deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error while deleting group", error);
    return NextResponse.json(
      { error: "Failed to Delete the group" },
      { status: 500 },
    );
  }
}
