// lib/access-control/getCommissionPercent.ts


import { PlanUserType } from "@prisma/client";
import { checkFeature } from "../access-control/checkFeature";
import { normalizeUserType } from "../utils/normalizedUserTypes";

export async function getCommissionPercent(params: {
  feature: string;
  userType: PlanUserType | null;
  membership: string | null;
}) {
  const normalizedUserType = normalizeUserType(params.userType);

  if (!normalizedUserType || !params.membership) {
    return 0;
  }

  const featureCheck = await checkFeature({
    feature: params.feature,
    user: {
      userType: normalizedUserType,
      membership: params.membership,
    },
  });

  if (!featureCheck.allowed) {
    return 0;
  }

  const config = featureCheck.config as {
    commissionPercent?: number;
  };

  return config?.commissionPercent ?? 0;
}