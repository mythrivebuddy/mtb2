import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateGoaProgressPercentage } from "@/lib/utils/makeover-program/makeover-dashboard/goa";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { CMP_NOTIFICATIONS } from "@/lib/constant";
import { NextRequest, NextResponse } from "next/server";
import { getCMPNotification } from "@/lib/utils/makeover-program/getNotificationTemplate";
import { NotificationType } from "@prisma/client";

/**
 * Business constant
 * 75% = minimum eligibility for Goa event
 */
const GOA_ELIGIBILITY_PERCENT = 75;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { programId } = await req.json();

  /* ------------------------------------------------
     1️⃣ Fetch fresh data
  ------------------------------------------------ */

  const pointsAgg = await prisma.makeoverPointsSummary.aggregate({
    where: {
      userId: session.user.id,
      programId,
    },
    _sum: { totalPoints: true },
  });

  const totalPoints = pointsAgg._sum.totalPoints ?? 0;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { max_golbal_points: true },
  });

  if (!program?.max_golbal_points) {
    return NextResponse.json({ success: true });
  }

  const state = await prisma.userProgramState.findUnique({
    where: {
      userId_programId: {
        userId: session.user.id,
        programId,
      },
    },
  });

  if (!state) {
    return NextResponse.json({ success: true });
  }

  /* ------------------------------------------------
     2️⃣ Calculate Goa milestone
  ------------------------------------------------ */

  const { crossedMilestone } = calculateGoaProgressPercentage({
    totalPoints,
    programMaxPoints: program.max_golbal_points,
    lastGoaMileStoneNotified: state.lastGoaMilestoneNotified,
  });

  if (!crossedMilestone) {
    return NextResponse.json({ success: true });
  }

  /* ------------------------------------------------
     3️⃣ Atomic guard (idempotent)
  ------------------------------------------------ */

  const updated = await prisma.userProgramState.updateMany({
    where: {
      userId: session.user.id,
      programId,
      lastGoaMilestoneNotified: { lt: crossedMilestone },
    },
    data: {
      lastGoaMilestoneNotified: crossedMilestone,
    },
  });

  // Already handled by another request/tab
  if (updated.count === 0) {
    return NextResponse.json({ success: true });
  }

  /* ------------------------------------------------
     4️⃣ Notifications
  ------------------------------------------------ */

  // A️⃣ Goa progress milestone
  {

    const notification = await getCMPNotification(
      NotificationType.CMP_GOA_PROGRESS_MILESTONE
    );
    const { title, description, url } = notification || CMP_NOTIFICATIONS.GOA_PROGRESS_MILESTONE;

    const dynamicTitle = title.replace("{{goaProgressMilestone}}", String(crossedMilestone));

    await sendPushNotificationToUser(
      session.user.id,
      dynamicTitle,
      description,
      { url }
    );
  }

  // B️⃣ Goa eligibility achieved (75%)
  if (crossedMilestone === GOA_ELIGIBILITY_PERCENT) {

    const notification = await getCMPNotification(NotificationType.CMP_GOA_ELIGIBLE);

    const { title, description, url } = notification || CMP_NOTIFICATIONS.GOA_ELIGIBLE;

    await sendPushNotificationToUser(
      session.user.id,
      title,
      description,
      { url }
    );
  }

  return NextResponse.json({ success: true });
}
