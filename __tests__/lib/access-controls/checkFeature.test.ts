import { checkFeature, checkFeatureAction } from "@/lib/access-control/checkFeature";
import { featureConfig } from "@/lib/access-control/featureConfig";
import { PlanUserType } from "@prisma/client";

describe("checkFeature", () => {
  it("denies access when user session is missing", () => {
    const res = checkFeature({
      feature: "spotlight",
      user: {},
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("INVALID_SESSION_STATE");
  });

  it("respects feature access rules", () => {
    const res = checkFeature({
      feature: "spotlight",
      user: {
        userType: PlanUserType.ENTHUSIAST,
        membership: "PAID",
      },
    });

    const allowedTypes =
      featureConfig.spotlight.access as readonly PlanUserType[];

    if (!allowedTypes.includes(PlanUserType.ENTHUSIAST)) {
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("USER_TYPE_NOT_ALLOWED");
    }
  });

  it("returns valid config for allowed user", () => {
    const res = checkFeature({
      feature: "spotlight",
      user: {
        userType: PlanUserType.COACH,
        membership: "PAID",
      },
    });

    expect(res.allowed).toBe(true);

    if (!res.allowed) {
      throw new Error("Expected allowed=true");
    }

    expect(res.config).toEqual(
      featureConfig.spotlight.plans.paid.COACH
    );
  });

 

describe("checkFeatureAction", () => {
  it("validates action permissions dynamically", () => {
    const allowed =
      featureConfig.challenges.actions.create as readonly PlanUserType[];

    const coachAllowed = checkFeatureAction({
      feature: "challenges",
      action: "create",
      userType: PlanUserType.COACH,
    });

    const enthusiastAllowed = checkFeatureAction({
      feature: "challenges",
      action: "create",
      userType: PlanUserType.ENTHUSIAST,
    });

    expect(coachAllowed).toBe(allowed.includes(PlanUserType.COACH));
    expect(enthusiastAllowed).toBe(allowed.includes(PlanUserType.ENTHUSIAST));
  });
});
});
