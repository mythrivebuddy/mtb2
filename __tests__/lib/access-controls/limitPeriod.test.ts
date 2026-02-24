import { getLimitPeriodStart } from "@/lib/access-control/limitPeriod";
import { LimitType } from "@/lib/access-control/featureConfig";

describe("getLimitPeriodStart", () => {
  const fixedDate = new Date("2024-06-15T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns start of current month for MONTHLY", () => {
    const result = getLimitPeriodStart("MONTHLY");

    expect(result).toEqual(new Date(2024, 5, 1)); // June = 5 (0-based)
  });

  it("returns start of current year for YEARLY", () => {
    const result = getLimitPeriodStart("YEARLY");

    expect(result).toEqual(new Date(2024, 0, 1));
  });

  it("returns null for LIFETIME", () => {
    const result = getLimitPeriodStart("LIFETIME");

    expect(result).toBeNull();
  });

  it("returns null for unexpected value (safety)", () => {
    const result = getLimitPeriodStart("LIFETIME" as LimitType);

    expect(result).toBeNull();
  });
});
