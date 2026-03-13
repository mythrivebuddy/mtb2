import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SpotlightStatus } from "@prisma/client";

// * get all spotlight applications
export async function GET(request: NextRequest) {
  try {
    // Check user role
    await checkRole("ADMIN", "You are not authorized for this action");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Fetch all spotlight applications sorted by appliedAt (oldest first) with pagination
    const spotlightApplications = await prisma.spotlight.findMany({
      include: {
        user: true,
      },
      // orderBy: {
      //   appliedAt: "desc",
      // },
      take: limit,
      skip: skip,
    });

    const getPriorityWeight = (app: {
      user: {
        userType: string | null;
        membership: string | null;
      };
    }) => {
      if (app.user.userType !== "COACH") return 0;
      return app.user.membership === "PAID" ? 1 : 0;
    };


    const getStatusRank = (status: SpotlightStatus) => {
      if (status === SpotlightStatus.APPLIED) return 0;
      if (status === SpotlightStatus.ACTIVE) return 1;
      return 2; // everything else
    };

    const sortedApplications = spotlightApplications.sort((a, b) => {
      // 1️⃣ Status order: APPLIED → ACTIVE → others
      const statusDiff = getStatusRank(a.status) - getStatusRank(b.status);
      if (statusDiff !== 0) return statusDiff;

      // 2️⃣ Priority weight (PAID > FREE)
      const priorityDiff = getPriorityWeight(b) - getPriorityWeight(a);
      if (priorityDiff !== 0) return priorityDiff;

      // 3️⃣ FCFS within same status & priority
      return (
        new Date(a.appliedAt).getTime() -
        new Date(b.appliedAt).getTime()
      );
    });





    const totalApplications = await prisma.spotlight.count();
    await prisma.spotlight.updateMany({
      where: { seenByAdmin: false },
      data: { seenByAdmin: true },
    });

    return NextResponse.json(
      { spotlightApplications: sortedApplications, totalApplications },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
