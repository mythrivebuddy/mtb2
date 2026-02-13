import { prisma } from "@/lib/prisma";
import { PlanInterval } from "@prisma/client";

export const PLAN_PRIORITY: Record<PlanInterval, number> = {
  FREE: 0,
  MONTHLY: 1,
  YEARLY: 2,
  ONE_TIME: 2,
  LIFETIME: 3,
};

export async function disableLowerMemberships(
  userId: string,
  newPlanInterval: PlanInterval
) {
  const newPriority = PLAN_PRIORITY[newPlanInterval];

  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "FREE_TRIAL", "FREE_GRANT"],
      },
    },
    include: {
      plan: true,
    },
  });

  const idsToDisable = activeSubscriptions
    .filter((sub) => PLAN_PRIORITY[sub.plan.interval] < newPriority)
    .map((sub) => sub.id);

  if (idsToDisable.length === 0) return;

  await prisma.subscription.updateMany({
    where: { id: { in: idsToDisable } },
    data: {
      status: "EXPIRED",
      endDate: new Date(),
    },
  });
}

export async function getUserActivePlanPriority(userId: string) {
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "FREE_GRANT", "FREE_TRIAL"],
      },
      endDate: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activeSubscription) return 0;

  return PLAN_PRIORITY[activeSubscription.plan.interval];
}
