import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { ProsperityDropStatus } from "@prisma/client";

const FINAL_STATUSES: ProsperityDropStatus[] = [
  ProsperityDropStatus.APPROVED,
  ProsperityDropStatus.DISAPPROVED,
];


export async function GET() {
  try {
    await checkRole("ADMIN", "You are not authorized for this action");

    const applications = await prisma.prosperityDrop.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userType: true,
            membership: true,
          },
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
    });
    const applicationsWithPriority = applications.map((app) => {
      const featureCheck = checkFeature({
        feature: "prosperityDrops",
        user: {
          userType: app.user.userType,
          membership: app.user.membership,
        },
      });

      let priorityWeight = 0;

      if (featureCheck.allowed) {
        const config = featureCheck.config as { priorityWeight?: number };
        priorityWeight = config.priorityWeight ?? 0;
      }

      return {
        ...app,
        priorityWeight,
      };
    });
    applicationsWithPriority.sort((a, b) => {
      const aIsFinal = FINAL_STATUSES.includes(a.status);
      const bIsFinal = FINAL_STATUSES.includes(b.status);

      // 1️⃣ Active first, final last
      if (aIsFinal !== bIsFinal) {
        return aIsFinal ? 1 : -1;
      }

      // 2️⃣ Both active → higher priority first
      if (!aIsFinal && !bIsFinal && b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight;
      }

      // 3️⃣ Both active + same priority → FIRST COME, FIRST SERVE
      if (!aIsFinal && !bIsFinal && a.priorityWeight === b.priorityWeight) {
        return (
          new Date(a.appliedAt).getTime() -
          new Date(b.appliedAt).getTime()
        );
      }

      // 4️⃣ Final applications → newer first (or keep stable)
      return (
        new Date(b.appliedAt).getTime() -
        new Date(a.appliedAt).getTime()
      );
    });




    return NextResponse.json(applicationsWithPriority);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
