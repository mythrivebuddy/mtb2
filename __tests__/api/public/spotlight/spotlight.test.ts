// 🔥 MOCK next/server FIRST

import { GET } from "@/app/api/public/spotlight/route";
import { prisma } from "@/lib/prisma";


jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));


jest.mock("@/lib/prisma", () => ({
  prisma: {
    spotlight: {
      findFirst: jest.fn(),
    },
  },
}));

describe("GET /api/public/spotlight", () => {
  it("returns spotlight data", async () => {
    (prisma.spotlight.findFirst as jest.Mock).mockResolvedValue({
      id: "spotlight-1",
      expiresAt: new Date(),
      user: {
        name: "John Doe",
        userBusinessProfile: {},
      },
    });

    const res = await GET(); // ✅ App Router style
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("id", "spotlight-1");
    expect(json.user.name).toBe("John Doe");
    expect(json.user.userBusinessProfile).toBeDefined();
  });
});
