// app/api/accountability-hub/groups/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Visibility,
  ProgressStage,
  NotesPrivacy,
  CycleDuration,
  GroupRole,
} from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";

// Mappings from form values to Prisma enums
const visibilityMap: Record<string, Visibility> = {
  members_visible: Visibility.MEMBERS_CAN_SEE_GOALS,
  admin_only: Visibility.PRIVATE,
};

// ✅ FIX: Use the correct enum members that actually exist on the NotesPrivacy type.
const notesPrivacyMap: Record<string, NotesPrivacy> = {
  member_and_admin: NotesPrivacy.MEMBER_AND_ADMIN,
  admin_only: NotesPrivacy.ADMIN_ONLY,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorId = session.user.id;

    const body = await req.json();
    const { groupName, description, visibility, notesPrivacy } = body;

    if (!groupName) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const newGroup = await prisma.group.create({
      data: {
        name: groupName,
        description: description,
        creatorId: creatorId,
        coachId: creatorId,
        visibility: visibilityMap[visibility] || Visibility.PRIVATE,
        progressStage: ProgressStage.NOT_STARTED,
        // ✅ FIX: The fallback value must also be a valid enum member.
        notesPrivacy: notesPrivacyMap[notesPrivacy] || NotesPrivacy.MEMBER_AND_ADMIN,
        cycleDuration: CycleDuration.MONTHLY,
        members: {
          create: {
            userId: creatorId,
            assignedBy: creatorId,
            role: GroupRole.ADMIN,
          },
        },
        cycles: {
          create: {
            startDate: new Date(),
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            status: "active",
            updatedAt: new Date(),
          },
        },
      },
    });

    await logActivity(
      newGroup.id,
      creatorId,
      "group_created",
      `The group "${newGroup.name}" was created.`
    );

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET function remains the same
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        cycles: {
          where: {
            status: "active",
          },
          orderBy: {
            startDate: "desc",
          },
          take: 1,
          include: {
            _count: {
              select: { goals: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}