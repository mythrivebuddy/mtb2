import { PlanUserType } from "@prisma/client";

export function normalizeUserType(
  type: unknown
): "COACH" | "ENTHUSIAST" | "SOLOPRENEUR" | null {
  if (type === PlanUserType.COACH) return "COACH";
  if (type === PlanUserType.ENTHUSIAST) return "ENTHUSIAST";
  if (type === PlanUserType.SOLOPRENEUR) return "SOLOPRENEUR";

  return null;
}