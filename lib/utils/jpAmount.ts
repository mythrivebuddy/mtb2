"use server"; // This is the magic line that makes it a Server Action

import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

/**
 * This Server Action fetches the JP amount for an activity.
 * It can be called from Client Components, but it will only run on the server.
 */
export async function getJpAmountForActivity(
  activity: ActivityType,
): Promise<number> {
  try {
    const activityData = await prisma.activity.findUnique({
      where: { activity },
    });

    if (!activityData || activityData.jpAmount === null) {
      console.warn(`Activity '${activity}' not found. Returning 0.`);
      return 0;
    }

    return activityData.jpAmount;
  } catch (error) {
    console.error(`Server Action Error:`, error);
    return 0;
  }
}