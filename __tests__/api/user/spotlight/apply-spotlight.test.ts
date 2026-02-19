import { POST, GET } from "@/app/api/user/spotlight/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { SpotlightStatus, ActivityType } from "@prisma/client";

/* ------------------ Mocks ------------------ */

jest.mock("next/server", () => ({
  NextResponse: {
    json: <T>(data: T, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async (): Promise<T> => data,
    }),
  },
}));

jest.mock("@/lib/utils/auth", () => ({
  checkRole: jest.fn(),
}));

jest.mock("@/lib/access-control/checkFeature", () => ({
  checkFeature: jest.fn(),
}));

jest.mock("@/lib/access-control/enforceLimitResponse", () => ({
  enforceLimitResponse: jest.fn(),
}));

jest.mock("@/lib/utils/jp", () => ({
  getJpToDeduct: jest.fn(),
}));

jest.mock("@/utils/sendEmail", () => ({
  sendEmailUsingTemplate: jest.fn(),
}));

jest.mock("@/lib/utils/notifications", () => ({
  getSpotlightAppliedNotificationData: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    activity: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    spotlight: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    transaction: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

/* ------------------ Imports after mocks ------------------ */

import { checkRole } from "@/lib/utils/auth";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { getJpToDeduct } from "@/lib/utils/jp";

/* ------------------ Helpers ------------------ */

const mockRequest = {} as unknown as NextRequest;

const mockSession = {
  user: {
    id: "user-1",
    userType: "USER",
    membership: "PAID",
  },
};

/* ------------------ POST Tests ------------------ */

describe("POST /api/spotlight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRole as jest.Mock).mockResolvedValue(mockSession);
    (enforceLimitResponse as jest.Mock).mockResolvedValue(null);
    (checkFeature as jest.Mock).mockReturnValue({
      allowed: true,
      config: {
        eligible: true,
        applyLimit: 5,
        applyLimitType: "MONTHLY",
      },
    });
  });

  it("returns 400 if spotlight activity not configured", async () => {
    (prisma.activity.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Spotlight activity not configured");
  });

  it("returns 400 if business profile incomplete", async () => {
    (prisma.activity.findUnique as jest.Mock).mockResolvedValue({ id: "act-1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      jpBalance: 100,
      userBusinessProfile: { isProfileComplete: false },
      spotlight: [],
      plan: {},
    });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Complete your business profile");
  });

  it("returns 400 if insufficient JP", async () => {
    (prisma.activity.findUnique as jest.Mock).mockResolvedValue({ id: "act-1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      jpBalance: 1,
      userBusinessProfile: { isProfileComplete: true },
      spotlight: [],
      plan: {},
    });

    (getJpToDeduct as jest.Mock).mockReturnValue(50);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Insufficient JP");
  });

  it("creates spotlight application successfully", async () => {
    (prisma.activity.findUnique as jest.Mock).mockResolvedValue({ id: "act-1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "John",
      jpBalance: 100,
      userBusinessProfile: { isProfileComplete: true },
      spotlight: [],
      plan: {},
    });

    (getJpToDeduct as jest.Mock).mockReturnValue(10);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toContain("Spotlight application created");
  });
});

/* ------------------ GET Tests ------------------ */

describe("GET /api/spotlight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRole as jest.Mock).mockResolvedValue(mockSession);
  });

  it("returns spotlight applications", async () => {
    (prisma.spotlight.findMany as jest.Mock).mockResolvedValue([
      { id: "spot-1", status: SpotlightStatus.APPLIED },
    ]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.length).toBe(1);
  });
});
