// lib/access-control/getFeatureAccess.ts

import { prisma } from "@/lib/prisma";

export async function getFeatureAccess(params: {
  featureKey: string;
  userType: "COACH" | "ENTHUSIAST" | "SOLOPRENEUR";
  membership: "FREE" | "PAID";
}) {
  const { featureKey, userType, membership } = params;

  // 1. get feature
  const feature = await prisma.feature.findFirst({
    where: {
      key: featureKey,
      isActive: true,
    },
  });

  if (!feature) {
    return { allowed: false, reason: "FEATURE_NOT_FOUND" };
  }

  // 2. check userType access
  if (!feature.allowedUserTypes.includes(userType)) {
    return { allowed: false, reason: "USER_TYPE_NOT_ALLOWED" };
  }

  // 3. get config
  const configRow = await prisma.featurePlanConfig.findFirst({
    where: {
      featureId: feature.id,
      membership,
      userType,
      isActive: true,
    },
  });

  if (!configRow) {
    return { allowed: false, reason: "CONFIG_NOT_FOUND" };
  }

  return {
    allowed: true,
    config: configRow.config, // JSON
    feature,
  };
}