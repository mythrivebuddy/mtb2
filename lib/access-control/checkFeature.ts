// lib/access-control/checkFeature.ts

import { PlanUserType } from "@prisma/client";
import { featureConfig, UNLIMITED } from "./featureConfig";

/* ----------------------------------
 * 🔐 Helper Types
 * ---------------------------------- */

export type FeatureKey = keyof typeof featureConfig;

type FeatureConfigMap = typeof featureConfig;
type SupportedUserType = "COACH" | "ENTHUSIAST";




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

  // ---------- validation ----------
  if (!user?.userType || !user?.membership) {
    return { allowed: false as const, reason: "INVALID_SESSION_STATE" as const };
  }

  if (
    !Object.values(PlanUserType).includes(user.userType as PlanUserType)
  ) {
    return { allowed: false as const, reason: "INVALID_USER_TYPE" as const };
  }

  if (user.membership !== "FREE" && user.membership !== "PAID") {
    return { allowed: false as const, reason: "INVALID_PLAN" as const };
  }

  if (
    user.userType !== PlanUserType.COACH &&
    user.userType !== PlanUserType.ENTHUSIAST
  ) {
    return { allowed: false as const, reason: "USER_TYPE_NOT_SUPPORTED" as const };
  }

  const userType = user.userType as SupportedUserType;

  const planKey = user.membership === "PAID" ? "paid" : "free";

  // ---------- access ----------
  const allowedUserTypes = config.access as readonly SupportedUserType[];

  if (!allowedUserTypes.includes(userType)) {
    return { allowed: false as const, reason: "USER_TYPE_NOT_ALLOWED" as const };
  }


  if (!("plans" in config)) {
    return { allowed: false as const, reason: "NO_PLAN_CONFIG" as const };
  }

  const plans = config.plans as Record<
    "free" | "paid",
    Partial<Record<SupportedUserType, unknown>>
  >;

  const planConfig = plans[planKey]?.[userType];
  

  if (planConfig === undefined) {
    return { allowed: false as const, reason: "PLAN_NOT_ALLOWED" as const };
  }

  return {
    allowed: true as const,
    config: planConfig,
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
