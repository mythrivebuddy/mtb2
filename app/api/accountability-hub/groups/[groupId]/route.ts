
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust path if using NextAuth

// PATCH /api/groups/:groupId/notes
export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const { notes } = await req.json();

    if (!notes && notes !== "") {
      return NextResponse.json(
        { error: "Notes field is required" },
        { status: 400 }
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

    const isMember = group.members.some(
      (m) => m.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Only Admins can update notes
    const memberRole = group.members.find(
      (m) => m.userId === session.user.id
    )?.role;

    if (memberRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update notes" },
        { status: 403 }
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

    return NextResponse.json(
      { message: "Notes updated successfully", group: updatedGroup,success:true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating notes:", error);
    return NextResponse.json(
      { error: "Failed to update notes" },
      { status: 500 }
    );
  }
}
