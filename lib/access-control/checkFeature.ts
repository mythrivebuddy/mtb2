// lib/access-control/checkFeature.ts

import { PlanUserType } from "@prisma/client";
import { featureConfig, UNLIMITED } from "./featureConfig";

/* ----------------------------------
 * 🔐 Helper Types
 * ---------------------------------- */

export type FeatureKey = keyof typeof featureConfig;

type FeatureConfigMap = typeof featureConfig;

type PlanConfig<F extends FeatureKey> =
  FeatureConfigMap[F] extends { free: infer F1; paid: infer P1 }
    ? F1 | P1
    : boolean;

type FeatureActions<F extends FeatureKey> =
  FeatureConfigMap[F] extends { actions: infer A } ? keyof A : never;

/* ----------------------------------
 * 🔎 Feature-Level Check
 * ---------------------------------- */

export function checkFeature<F extends FeatureKey>(params: {
  feature: F;
  user: {
    userType?: unknown;
    membership?: unknown;
  };
}) {
  const { feature, user } = params;
  const config = featureConfig[feature];

  /* ----------------------------------
   * 🚫 Invalid / missing session data
   * ---------------------------------- */

  if (!user?.userType || !user?.membership) {
    return {
      allowed: false as const,
      reason: "INVALID_SESSION_STATE" as const,
    };
  }

  if (
    !Object.values(PlanUserType).includes(
      user.userType as PlanUserType
    )
  ) {
    return {
      allowed: false as const,
      reason: "INVALID_USER_TYPE" as const,
    };
  }

  if (user.membership !== "FREE" && user.membership !== "PAID") {
    return {
      allowed: false as const,
      reason: "INVALID_PLAN" as const,
    };
  }

  const userType = user.userType as PlanUserType;
  const planKey = user.membership === "PAID" ? "paid" : "free";

  /* ----------------------------------
   * 🚫 Explicitly unsupported personas
   * ---------------------------------- */

  if (
    userType === PlanUserType.SOLOPRENEUR ||
    userType === PlanUserType.ALL
  ) {
    return {
      allowed: false as const,
      reason: "USER_TYPE_NOT_SUPPORTED" as const,
    };
  }

  /* ----------------------------------
   * 🔑 UserType-level access
   * ---------------------------------- */

  const allowedUserTypes =
    config.access as readonly PlanUserType[];

  if (!allowedUserTypes.includes(userType)) {
    return {
      allowed: false as const,
      reason: "USER_TYPE_NOT_ALLOWED" as const,
    };
  }

  /* ----------------------------------
   * 💳 Plan-level access
   * ---------------------------------- */

  const planValue = config[planKey];

  if (typeof planValue === "boolean") {
    return planValue
      ? {
          allowed: true as const,
          config: true,
          isUnlimited: () => false,
        }
      : {
          allowed: false as const,
          reason: "PLAN_NOT_ALLOWED" as const,
        };
  }

  return {
    allowed: true as const,
    config: planValue as PlanConfig<F>,
    isUnlimited: (value?: number) => value === UNLIMITED,
  };
}

/* ----------------------------------
 * 🔑 Action-Level Permission Check
 * ---------------------------------- */

export function checkFeatureAction<
  F extends FeatureKey,
  A extends FeatureActions<F>
>(params: {
  feature: F;
  action: A;
  userType?: unknown;
}) {
  const { feature, action, userType } = params;
  const config = featureConfig[feature];

  if (
    !userType ||
    !Object.values(PlanUserType).includes(
      userType as PlanUserType
    )
  ) {
    return false;
  }

  const normalizedUserType = userType as PlanUserType;

  if (
    normalizedUserType === PlanUserType.SOLOPRENEUR ||
    normalizedUserType === PlanUserType.ALL
  ) {
    return false;
  }

  if (!("actions" in config)) {
    return false;
  }

  const allowedUserTypes =
    config.actions[action] as readonly PlanUserType[];

  return allowedUserTypes.includes(normalizedUserType);
}
