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

// --- START OF CORRECTED CODE ---

const visibilityMap: Record<string, Visibility> = {
  members_visible: Visibility.MEMBERS_CAN_SEE_GOALS,
  // Corrected: The enum is likely 'PRIVATE', not 'ADMIN_ONLY'.
  admin_only: Visibility.PRIVATE,
};

const progressStageMap: Record<string, ProgressStage> = {
  // Corrected: The 'ProgressStage' enum from your schema does not contain
  // 'TWO_STAGE' or 'THREE_STAGE'. We must cast these strings to satisfy the type,
  // which matches the original logic of your code. This indicates the database
  // column expects these exact string values.
  "2_stage": "TWO_STAGE" as ProgressStage,
  "3_stage": "THREE_STAGE" as ProgressStage,
};

const notesPrivacyMap: Record<string, NotesPrivacy> = {
  // Corrected: Mapping to the available enum values from your schema.
  member_and_admin: NotesPrivacy.VISIBLE_TO_GROUP,
  admin_only: NotesPrivacy.PRIVATE_TO_AUTHOR,
};

// --- END OF CORRECTED CODE ---

const cycleDurationMap: Record<string, CycleDuration> = {
  weekly: CycleDuration.WEEKLY,
  bi_weekly: CycleDuration.BIWEEKLY,
  monthly: CycleDuration.MONTHLY,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const userId = session.user.id;

    const body = await req.json();
    const {
      name,
      description,
      visibility,
      progressStage,
      notesPrivacy,
      cycleDuration,
      coachId,
    } = body;

    const newGroup = await prisma.group.create({
      data: {
        name,
        description,
        visibility: visibilityMap[visibility],
        progressStage: progressStageMap[progressStage],
        notesPrivacy: notesPrivacyMap[notesPrivacy],
        cycleDuration: cycleDurationMap[cycleDuration],
        coachId,
        creatorId: userId,
        members: {
          create: {
            userId: userId,
            role: "ADMIN",
            assignedBy: userId,
          },
        },
      },
    });

    return new Response(JSON.stringify(newGroup), { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// GET function remains the same...
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
        cycles: {
          where: {
            status: "active",
          },
          orderBy: {
            startDate: "desc",
          },
          take: 1,
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