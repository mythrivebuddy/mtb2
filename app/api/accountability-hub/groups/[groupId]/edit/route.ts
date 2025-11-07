import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = params;
    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }
    if (session.user.role != "ADMIN") {
        return NextResponse.json({ error: "Only admin can update group" }, { status: 401 });
    }
    const body = await req.json();
    const {
      groupName,
      description,
      visibility,
      duration,
      stages,
      notesPrivacy,
    } = body;

    // ✅ Update the group
    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: groupName,
        description,
        visibility,
        cycleDuration: duration,
        progressStage: stages,
        notesPrivacy,
      },
    });

    logActivity(groupId,session.user.id,"group_created",`This group has updated by Platform Admin`);

    return NextResponse.json({
      success: true,
      message: `${updated.name} updated successfully`,
      group: updated,
    });
  } catch (err) {
    console.error("[GROUP_EDIT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
