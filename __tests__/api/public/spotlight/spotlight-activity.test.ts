import { POST } from "@/app/api/public/spotlight-activity/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/* ------------------ Types ------------------ */

type ActivityRequestBody = {
  spotlightId: string;
  type: "VIEW" | "CONNECT";
};

type InvalidRequestBody = {
  spotlightId?: unknown;
  type?: unknown;
};

type MockRequest<T> = {
  json: () => Promise<T>;
};

/* ------------------ Mocks ------------------ */

jest.mock("next/server", () => ({
  NextResponse: {
    json: <T>(data: T, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async (): Promise<T> => data,
    }),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    spotlight: {
      findUnique: jest.fn(),
    },
    spotlightActivity: {
      create: jest.fn(),
    },
  },
}));
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});


/* ------------------ Tests ------------------ */

describe("POST /api/spotlight/activity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates activity for valid data", async () => {
    (prisma.spotlight.findUnique as jest.Mock).mockResolvedValue({
      id: "spotlight-1",
    });

    (prisma.spotlightActivity.create as jest.Mock).mockResolvedValue({
      id: "activity-1",
      type: "VIEW",
      spotlightId: "spotlight-1",
    });

    const req: MockRequest<ActivityRequestBody> = {
      json: async () => ({
        spotlightId: "spotlight-1",
        type: "VIEW",
      }),
    };

    // ✅ THE ONLY REQUIRED CAST
    const res = await POST(req as unknown as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 for invalid payload", async () => {
    const req: MockRequest<InvalidRequestBody> = {
      json: async () => ({ spotlightId: 123 }),
    };

    const res = await POST(req as unknown as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request data");
  });

  it("returns 404 if spotlight not found", async () => {
    (prisma.spotlight.findUnique as jest.Mock).mockResolvedValue(null);

    const req: MockRequest<ActivityRequestBody> = {
      json: async () => ({
        spotlightId: "missing",
        type: "VIEW",
      }),
    };

    const res = await POST(req as unknown as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Spotlight not found");
  });

  it("returns 500 on unexpected error", async () => {
    (prisma.spotlight.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB crashed")
    );

    const req: MockRequest<ActivityRequestBody> = {
      json: async () => ({
        spotlightId: "spotlight-1",
        type: "CONNECT",
      }),
    };

    const res = await POST(req as unknown as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to track activity");
  });
});
