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

    const { memberId } = params;
    const { searchParams } = new URL(_req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const requesterMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id, groupId: groupId },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group" }, { status: 403 });
    }

    // <-- FIX STARTS HERE
    const memberDetails = await prisma.groupMember.findFirst({ // 1. Use findFirst for composite where clauses
      where: { 
        userId: memberId, // 2. Use userId (from memberId) and groupId to find the member
        groupId: groupId,
      },
      include: {
        group: { select: { name: true } },
        user: { // 3. The 'goals' relation is on the User, so nest it here
          include: {
            Goal: {
              orderBy: { cycle: { startDate: "desc" } },
              include: {
                cycle: { select: { startDate: true, endDate: true } },
                comments: {
                  include: { author: { select: { name: true, image: true } } },
                  orderBy: { createdAt: 'asc' }
                },
              },
            },
          }
        },
      },
    });
    // <-- FIX ENDS HERE

    if (!memberDetails) {
      return NextResponse.json({ error: "Member not found in this group" }, { status: 404 });
    }
    
    // Your existing logic to add the requester's role is perfectly fine.
    const responseData = {
      ...memberDetails,
      requesterRole: requesterMembership.role,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[GET_MEMBER_DETAILS]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}