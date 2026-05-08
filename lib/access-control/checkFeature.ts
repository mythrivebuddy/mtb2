// lib/access-control/checkFeature.ts

import { PlanUserType, Prisma } from "@prisma/client";
import { featureConfig } from "./featureConfig";
import { getFeatureAccess } from "./getFeatureAccess";

/* ----------------------------------
 * 🔐 Helper Types
 * ---------------------------------- */

export type FeatureKey = keyof typeof featureConfig;

type SupportedUserType = "COACH" | "ENTHUSIAST" | "SOLOPRENEUR";

type FeatureActionsMap = Record<string, SupportedUserType[]>;

type FeatureFromDB = {
  actions: Prisma.JsonValue; // ✅ correct source type
};

/* ----------------------------------
 * 🔎 Feature-Level Check
 * ---------------------------------- */

// export function checkFeature<F extends FeatureKey>(params: {
//   feature: F;
//   user: {
//     userType?: unknown;
//     membership?: unknown;
//   };
// }) {
//   const { feature, user } = params;
//   const config = featureConfig[feature];

//   // ---------- validation ----------
//   if (!user?.userType || !user?.membership) {
//     return { allowed: false as const, reason: "INVALID_SESSION_STATE" as const };
//   }

//   if (
//     !Object.values(PlanUserType).includes(user.userType as PlanUserType)
//   ) {
//     return { allowed: false as const, reason: "INVALID_USER_TYPE" as const };
//   }

//   if (user.membership !== "FREE" && user.membership !== "PAID") {
//     return { allowed: false as const, reason: "INVALID_PLAN" as const };
//   }

//   if (
//     user.userType !== PlanUserType.COACH &&
//     user.userType !== PlanUserType.ENTHUSIAST
//   ) {
//     return { allowed: false as const, reason: "USER_TYPE_NOT_SUPPORTED" as const };
//   }

//   const userType = user.userType as SupportedUserType;

//   const planKey = user.membership === "PAID" ? "paid" : "free";

//   // ---------- access ----------
//   const allowedUserTypes = config.access as readonly SupportedUserType[];

//   if (!allowedUserTypes.includes(userType)) {
//     return { allowed: false as const, reason: "USER_TYPE_NOT_ALLOWED" as const };
//   }

//   if (!("plans" in config)) {
//     return { allowed: false as const, reason: "NO_PLAN_CONFIG" as const };
//   }

//   const plans = config.plans as Record<
//     "free" | "paid",
//     Partial<Record<SupportedUserType, unknown>>
//   >;

//   const planConfig = plans[planKey]?.[userType];

//   if (planConfig === undefined) {
//     return { allowed: false as const, reason: "PLAN_NOT_ALLOWED" as const };
//   }

//   return {
//     allowed: true as const,
//     config: planConfig,
//     isUnlimited: (value?: number) => value === UNLIMITED,
//   };
// }

/* ----------------------------------
 * 🔑 Action-Level Permission Check
 * ---------------------------------- */

// export function checkFeatureAction<
//   F extends FeatureKey,
//   A extends FeatureActions<F>
// >(params: {
//   feature: F;
//   action: A;
//   userType?: unknown;
// }) {
//   const { feature, action, userType } = params;
//   const config = featureConfig[feature];

//   if (
//     !userType ||
//     !Object.values(PlanUserType).includes(
//       userType as PlanUserType
//     )
//   ) {
//     return false;
//   }

//   const normalizedUserType = userType as PlanUserType;

//   if (
//     normalizedUserType === PlanUserType.SOLOPRENEUR ||
//     normalizedUserType === PlanUserType.ALL
//   ) {
//     return false;
//   }

//   if (!("actions" in config)) {
//     return false;
//   }

//   const allowedUserTypes =
//     config.actions[action] as readonly PlanUserType[];

//   return allowedUserTypes.includes(normalizedUserType);
// }

/* ----------------------------------
 * 🔎 Feature-Level Check (DB Driven)
 * ---------------------------------- */

export async function checkFeature(params: {
  feature: string;
  user: {
    userType?: SupportedUserType;
    membership?: string;
  };
}) {
  const { feature, user } = params;

  // ---------- validation ----------
  if (!user?.userType || !user?.membership) {
    return {
      allowed: false as const,
      reason: "INVALID_SESSION_STATE" as const,
    };
  }

  if (!Object.values(PlanUserType).includes(user.userType as PlanUserType)) {
    return { allowed: false as const, reason: "INVALID_USER_TYPE" as const };
  }

  if (user.membership !== "FREE" && user.membership !== "PAID") {
    return { allowed: false as const, reason: "INVALID_PLAN" as const };
  }

  if (
    user.userType !== PlanUserType.COACH &&
    user.userType !== PlanUserType.ENTHUSIAST
  ) {
    return {
      allowed: false as const,
      reason: "USER_TYPE_NOT_SUPPORTED" as const,
    };
  }

  const userType = user.userType as "COACH" | "ENTHUSIAST";
  const membership = user.membership as "FREE" | "PAID";

  // ---------- DB call ----------
  const result = await getFeatureAccess({
    featureKey: feature,
    userType,
    membership,
  });

  if (!result.allowed) {
    return result;
  }

  // ---------- parse config (IMPORTANT) ----------
  const parsedConfig =
    typeof result.config === "string"
      ? JSON.parse(result.config)
      : result.config;

  return {
    allowed: true as const,
    config: parsedConfig,
    feature: result.feature, // needed for actions
    isUnlimited: (value?: number) => value === -1,
  };
}

/* ----------------------------------
 * 🔑 Action-Level Permission Check (DB)
 * ---------------------------------- */
function validateActions(input: unknown): FeatureActionsMap | null {
  if (typeof input !== "object" || input === null) return null;

  const record = input as Record<string, unknown>;

  for (const key in record) {
    const value = record[key];

    if (
      !Array.isArray(value) ||
      !value.every((v) => v === "COACH" || v === "ENTHUSIAST")
    ) {
      return null;
    }
  }

  return record as FeatureActionsMap;
}
function parseActions(actions: Prisma.JsonValue): FeatureActionsMap | null {
  if (!actions) return null;

  // ✅ Case 1: string → parse JSON
  if (typeof actions === "string") {
    try {
      const parsed = JSON.parse(actions);
      return validateActions(parsed);
    } catch {
      return null;
    }
  }

  // ✅ Case 2: already object → validate directly
  if (typeof actions === "object" && !Array.isArray(actions)) {
    return validateActions(actions);
  }

  // ❌ reject everything else (number, boolean, array)
  return null;
}
export function checkFeatureAction(params: {
  feature: FeatureFromDB;
  action: string;
  userType?: PlanUserType;
}) {
  const { feature, action, userType } = params;

  if (!userType) return false;

  if (userType !== PlanUserType.COACH && userType !== PlanUserType.ENTHUSIAST) {
    return false;
  }

  const actions = parseActions(feature.actions);

  if (!actions) return false;

  const allowedUsers = actions[action];

  if (!allowedUsers) return false;

  return allowedUsers.includes(userType);
}
