// This api route blocks a group and only platform admins can block groups
// /api/accountability-hub/groups/block-group with a patch req with searchParams groupId
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Platform admin only
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only platform admins can block groups" },
        { status: 403 }
      );
    }

    // ✅ Extract search param
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required in search params" },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        isBlocked: !group.isBlocked, // ✅ Toggle
      },
    });
    await logActivity(groupId, session.user.id,"group_blocked", updated.isBlocked ? `This group has been blocked by the platform administrator.` : "The platform admin has unblocked this group.");

    return NextResponse.json({
      message: updated.isBlocked
        ? `${updated.name} group blocked successfully.`
        : `${updated.name} group unblocked successfully`,
      group: updated,
      success:true,
    });
  } catch (error) {
    console.error("Block group error:", error);
    return NextResponse.json(
      { error: "Failed to block/unblock group" },
      { status: 500 }
    );
  }
}
