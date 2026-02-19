import { featureConfig, UNLIMITED } from "@/lib/access-control/featureConfig";


const SUPPORTED_USER_TYPES = ["COACH", "ENTHUSIAST"] as const;
type SupportedUserType = (typeof SUPPORTED_USER_TYPES)[number];

describe("featureConfig (static contract tests)", () => {
    it("defines access rules for every feature", () => {
        for (const config of Object.values(featureConfig)) {
            expect(Array.isArray(config.access)).toBe(true);

            for (const userType of config.access) {
                expect(
                    SUPPORTED_USER_TYPES.includes(userType as SupportedUserType)
                ).toBe(true);
            }
        }
    });

    it("defines free and paid plans for every feature", () => {
        for (const config of Object.values(featureConfig)) {
            expect(config.plans).toBeDefined();
            expect(config.plans).toHaveProperty("free");
            expect(config.plans).toHaveProperty("paid");
        }
    });

    it("uses UNLIMITED consistently as -1", () => {
        expect(UNLIMITED).toBe(-1);
    });

    it("does not reference unsupported user types in access", () => {
        for (const config of Object.values(featureConfig)) {
            for (const userType of config.access) {
                expect(
                    SUPPORTED_USER_TYPES.includes(userType as SupportedUserType)
                ).toBe(true);
            }
        }
    });

    it("validates action user types when actions exist", () => {
        for (const config of Object.values(featureConfig)) {
            if (!("actions" in config)) continue;

            for (const actionUsers of Object.values(config.actions)) {
                for (const userType of actionUsers) {
                    expect(
                        SUPPORTED_USER_TYPES.includes(userType as SupportedUserType)
                    ).toBe(true);
                }
            }
        }
    });

    it("ensures paid plans only reference supported user types", () => {
        for (const config of Object.values(featureConfig)) {
            const paidPlans = config.plans.paid;

            for (const userType of Object.keys(paidPlans)) {
                expect(
                    SUPPORTED_USER_TYPES.includes(userType as SupportedUserType)
                ).toBe(true);
            }
        }
    });

});
