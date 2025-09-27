// app/api/accountability-hub/groups/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Visibility,
  ProgressStage,
  NotesPrivacy,
  CycleDuration,
} from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";

const visibilityMap: Record<string, Visibility> = {
  members_visible: Visibility.MEMBERS_CAN_SEE_GOALS,
  admin_only: "ADMIN_ONLY" as Visibility,
};

const progressStageMap: Record<string, ProgressStage> = {
  "2_stage": "TWO_STAGE" as ProgressStage,
  "3_stage": "THREE_STAGE" as ProgressStage,
};

const notesPrivacyMap: Record<string, NotesPrivacy> = {
  member_and_admin: "MEMBER_AND_ADMIN" as NotesPrivacy,
  admin_only: "ADMIN_ONLY" as NotesPrivacy,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const coachId = session.user.id;

    const body = await req.json();
    const {
      groupName,
      description,
      visibility,
      stages,
      notesPrivacy,
    } = body;

    if (!groupName) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const newGroup = await prisma.group.create({
      data: {
        name: groupName,
        description: description,
        coachId: coachId,
        visibility: visibilityMap[visibility],
        progressStage: progressStageMap[stages],
        notesPrivacy: notesPrivacyMap[notesPrivacy],
        cycleDuration: CycleDuration.MONTHLY,
        members: {
          create: {
            userId: coachId,
            role: "admin",
          },
        },
        cycles: {
          create: {
            startDate: new Date(),
            endDate: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0
            ),
            status: "active",
          },
        },
      },
    });

     await logActivity(
      newGroup.id,
      'group_created',
      `The group "${newGroup.name}" was created.`
    );

   

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

//This APi finds all groups where the current user is a member
//It includes the current active cycle's dates and a count of all members in the group
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Find all groups where the current user is a member
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        // Include the current active cycle's dates
        cycles: {
          where: {
            status: "active",
          },
          orderBy: {
            startDate: "desc",
          },
          take: 1,
        },
        // Include a count of all members in the group
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