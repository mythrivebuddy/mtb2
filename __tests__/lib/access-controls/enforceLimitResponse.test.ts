import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { UNLIMITED } from "@/lib/access-control/featureConfig";

/* ------------------ Mock next/server ------------------ */
jest.mock("next/server", () => ({
  NextResponse: {
    json: <T>(data: T, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async (): Promise<T> => data,
    }),
  },
}));

describe("enforceLimitResponse", () => {
  it("returns null when limit is UNLIMITED", async () => {
    const res = await enforceLimitResponse({
      limit: UNLIMITED,
      currentCount: 999,
    });

    expect(res).toBeNull();
  });

  it("returns null when currentCount is below limit", async () => {
    const res = await enforceLimitResponse({
      limit: 5,
      currentCount: 3,
    });

    expect(res).toBeNull();
  });

  it("blocks when currentCount equals limit", async () => {
    const res = await enforceLimitResponse({
      limit: 3,
      currentCount: 3,
      message: "Limit reached",
      statusCode: 400,
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(400);

    const body = await res!.json();
    expect(body.message).toBe("Limit reached");
  });

  it("blocks when currentCount exceeds limit", async () => {
    const res = await enforceLimitResponse({
      limit: 1,
      currentCount: 5,
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);

    const body = await res!.json();
    expect(body.message).toBe("Upgrade required");
  });

  it("passes isUpgradeFlagShow when provided", async () => {
    const res = await enforceLimitResponse({
      limit: 1,
      currentCount: 1,
      isUpgradeFlagShow: true,
    });

    const body = await res!.json();
    expect(body.isUpgradeFlagShow).toBe(true);
  });
});
