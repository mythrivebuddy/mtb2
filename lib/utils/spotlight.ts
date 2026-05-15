import { NotificationType, SpotlightStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import { format } from "date-fns";

import { sendPushNotificationFromDBToUser } from "./pushNotifications"; // Add this import

const SPOTLIGHT_EXPIREY_MS = 24 * 60 * 60 * 1000;
// const SPOTLIGHT_EXPIREY_MS = 60 * 1000; //for dev seted to 1 min
// TODO: get expiry from days and it will be in days see defaultDurationDays in spotlight model

// export async function approveSpotlight(spotlightId: string) {
//   await prisma.spotlight.update({
//     where: { id: spotlightId },
//     data: { status: "APPROVED" },
//   });
// }

export async function activateNextSpotlight() {
  const nextSpotlight = await prisma.spotlight.findFirst({
    where: { status: SpotlightStatus.APPROVED },
    orderBy: { appliedAt: "asc" }, // Get the oldest approved request
  });

  console.log("nextSpotlight", nextSpotlight); //?dev
  if (nextSpotlight) {
    const updatedSpotlight = await prisma.spotlight.update({
      where: { id: nextSpotlight.id },
      data: {
        status: SpotlightStatus.ACTIVE,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + SPOTLIGHT_EXPIREY_MS),
      },
    });

    await sendPushNotificationFromDBToUser({
      type: NotificationType.SPOTLIGHT_ACTIVE,
      userId: nextSpotlight.userId,
      context: {}, // add dynamic fields later if needed
    });

    const user = await prisma.user.findUnique({
      where: { id: nextSpotlight.userId },
    });

    if (user?.email && user.name && updatedSpotlight.activatedAt) {
      await sendEmailUsingTemplate({
        toEmail: user.email,
        toName: user.name,
        templateId: "spotlight-active",
        templateData: {
          username: user.name,
          insert_date: format(updatedSpotlight.activatedAt, "MMM d, yyyy"),
        },
      });
    } else {
      console.warn(
        "Missing user info or activatedAt date for spotlight email.",
      );
    }
  }
}

export async function checkAndRotateSpotlight() {
  const activeSpotlight = await prisma.spotlight.findFirst({
    where: { status: SpotlightStatus.ACTIVE },
  });

  if (!activeSpotlight) {
    // If no active spotlight, try to activate one
    await activateNextSpotlight();
    return;
  }

  const isExpired = activeSpotlight.expiresAt! < new Date();

  if (isExpired) {
    // Check if we have a next spotlight waiting
    const nextSpotlight = await prisma.spotlight.findFirst({
      where: { status: SpotlightStatus.APPROVED },
      orderBy: { appliedAt: "asc" },
    });

    if (nextSpotlight) {
      // Expire current and activate next
      await prisma.spotlight.update({
        where: { id: activeSpotlight.id },
        data: { status: SpotlightStatus.EXPIRED },
      });
      await activateNextSpotlight();
    } else {
      // No new spotlight — extend current one
      await prisma.spotlight.update({
        where: { id: activeSpotlight.id },
        data: {
          expiresAt: new Date(Date.now() + SPOTLIGHT_EXPIREY_MS),
        },
      });
    }
  }
}
