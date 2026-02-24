// lib/access-control/limitPeriod.ts
import { LimitType } from "./featureConfig";

export function getLimitPeriodStart(type: LimitType): Date | null {
  const now = new Date();

  switch (type) {
    case "MONTHLY":
      return new Date(now.getFullYear(), now.getMonth(), 1);

    case "YEARLY":
      return new Date(now.getFullYear(), 0, 1);

    case "LIFETIME":
    default:
      return null;
  }
}
