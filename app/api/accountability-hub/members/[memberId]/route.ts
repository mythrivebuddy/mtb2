// app/api/accountability-hub/members/[memberId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const { searchParams } = new URL(_req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Security check: Ensure the user requesting the data is a member of the same group.
    const requesterMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id, groupId: groupId },
    });
    if (!requesterMembership && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- THIS IS THE CORRECTED QUERY ---
    // We fetch the GroupMember and include its direct relations: 'user' and 'goals'.
    const memberDetails = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: memberId, groupId } },
      include: {
        user: true, // Includes the full user profile (name, image, etc.)
        group: { select: { name: true,progressStage:true, id: true,isBlocked:true } }, // Gets the group's name
        goals: {
          // Gets the goals directly related to this GroupMember
          orderBy: { cycle: { startDate: "desc" } }, // Show newest cycle's goals first
          include: {
            cycle: { select: { startDate: true, endDate: true } },
            comments: {
              // Pre-fetch comments for the goals
              include: { author: { select: { id: true, name: true, image: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
    // ------------------------------------

    if (!memberDetails) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Add the requester's role to the response for the frontend
    const responseData = {
      ...memberDetails,
      requesterRole: requesterMembership?.role || 'MEMBER',
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[GET_MEMBER_DETAILS]`, error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
