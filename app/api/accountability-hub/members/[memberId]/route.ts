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
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const requesterMembership = await prisma.groupMember.findFirst({
      where: { userId: session.user.id, groupId: groupId },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const memberDetails = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
        group: { select: { name: true } },
        goals: {
          orderBy: { cycle: { startDate: "desc" } },
          include: {
            cycle: { select: { startDate: true, endDate: true } },
            comments: {
              include: { author: { select: { name: true, image: true } } },
              orderBy: { createdAt: 'asc' }
            },
          },
        },
      },
    });

    if (!memberDetails) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    
    // --- THIS IS THE FIX ---
    // Create a new object containing all memberDetails, plus the requester's role.
    // This is type-safe and avoids using `any`.
    const responseData = {
      ...memberDetails,
      requesterRole: requesterMembership.role,
    };
    // ----------------------

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[GET_MEMBER_DETAILS]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}