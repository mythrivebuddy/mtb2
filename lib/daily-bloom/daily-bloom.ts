import { prisma } from "@/lib/prisma";
import { checkFeature } from "../access-control/checkFeature";
import { UNLIMITED } from "../access-control/featureConfig";
import { assignJp } from "../utils/jp";
import { ActivityType } from "@prisma/client";
import { Session } from "next-auth";

type DailyBloomPlanConfig = {
  dailyLimit: number;
};
type CreateDailyBloomInput = {
  title: string;
  description?: string;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  addToCalendar?: boolean;
  userId: string;
  user: Session["user"]; // session.user
  alignedActionId?: string;
};

export async function createDailyBloom({
  title,
  description,
  dueDate,
  startTime,
  endTime,
  addToCalendar,
  userId,
  user,
  alignedActionId,
}: CreateDailyBloomInput) {
  // ✅ Feature check
  const featureResult = checkFeature({
    feature: "dailyBlooms",
    user,
  });

  if (!featureResult.allowed) {
    throw new Error(featureResult.reason || "Feature not allowed");
  }
  const planConfig =
    typeof featureResult.config === "object"
      ? (featureResult.config as DailyBloomPlanConfig)
      : null;

  if (!planConfig) {
    throw new Error("Daily Bloom configuration not found");
  }

  // ✅ Daily limit check
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bloomsToday = await prisma.todo.count({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (
    planConfig.dailyLimit !== UNLIMITED &&
    bloomsToday >= planConfig.dailyLimit
  ) {
    throw new Error(
      `You have reached your daily limit of ${planConfig.dailyLimit} Daily Blooms.`,
    );
  }

  // ✅ Description formatting
  let baseDescription = description || "";
  baseDescription = baseDescription.replace(/\[Time:.*?\]/, "").trim();

  let finalDescription = baseDescription;

  if (addToCalendar && startTime) {
    const timeString = `[Time: ${startTime}${endTime ? `-${endTime}` : ""}]`;
    finalDescription = `${baseDescription} ${timeString}`.trim();
  }

  // ✅ Create bloom
  const newBloom = await prisma.todo.create({
    data: {
      title,
      description: finalDescription || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId,
      isFromEvent: addToCalendar,
      startTime: startTime || null,
      endTime: endTime || null,
      alignedActionId: alignedActionId || null,
    },
  });

  // ✅ GP Assignment
  const fullUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });

  if (fullUser && !newBloom.taskAddJP) {
    try {
      await assignJp(fullUser, ActivityType.DAILY_BLOOM_CREATION_REWARD);

      await prisma.todo.update({
        where: { id: newBloom.id },
        data: { taskAddJP: true },
      });
    } catch (error) {
      console.error("JP assignment error:", error);
    }
  }

  return newBloom;
}
