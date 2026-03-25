/**
 * @jest-environment node
 */

import { GET } from "@/app/api/user/store/items/get-item-by-id/route"; // 🔁 update path
import { prisma } from "@/lib/prisma";

// ── Mock Prisma ─────────────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
    },
  },
}));

// ── Helper ───────────────────────────────────────────────────────────────────

const mockRequest = (url: string) =>
  ({
    url,
  } as any);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/store/items/get-item-by-id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if id is missing", async () => {
    const req = mockRequest("http://localhost/api");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      error: "Item ID is required",
    });
  });

  it("should return 404 if item not found", async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const req = mockRequest("http://localhost/api?id=123");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({
      error: "Item not found",
    });

    expect(prisma.item.findUnique).toHaveBeenCalledWith({
      where: { id: "123" },
      select: {
        id: true,
        name: true,
        basePrice: true,
        monthlyPrice: true,
        yearlyPrice: true,
        lifetimePrice: true,
        imageUrl: true,
      },
    });
  });

  it("should return item successfully", async () => {
    const mockItem = {
      id: "123",
      name: "Test Item",
      basePrice: 100,
      monthlyPrice: 10,
      yearlyPrice: 100,
      lifetimePrice: 500,
      imageUrl: "img.jpg",
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const req = mockRequest("http://localhost/api?id=123");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      item: mockItem,
    });
  });

  it("should return 500 on server error", async () => {
    (prisma.item.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const req = mockRequest("http://localhost/api?id=123");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({
      error: "Internal Server Error",
    });
  });
});