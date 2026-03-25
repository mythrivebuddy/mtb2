/**
 * @jest-environment node
 */

import { GET } from "@/app/api/user/store/items/get-item/route"; // 🔁 adjust path
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ── Mocks ─────────────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────

const mockRequest = (url: string) =>
  ({
    url,
  } as Request);

// ── Tests ─────────────────────────────────────────────────────────────

describe("GET /api/store/items/get-item", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = mockRequest("http://localhost/api?itemId=1");

    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe("Unauthorized");
  });

  it("should return 400 if itemId is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const req = mockRequest("http://localhost/api");

    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(400);
    expect(text).toBe("Item ID is required");
  });

  it("should return 404 if item not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const req = mockRequest("http://localhost/api?itemId=123");

    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(404);
    expect(text).toBe("Item not found");

    expect(prisma.item.findUnique).toHaveBeenCalledWith({
      where: { id: "123" },
      include: { category: true },
    });
  });

  it("should return item successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const mockItem = {
      id: "123",
      name: "Test Item",
      imageUrl: "img.jpg",
      basePrice: 100,
      monthlyPrice: 10,
      yearlyPrice: 100,
      lifetimePrice: 500,
      currency: "INR",
      category: {
        id: "cat1",
        name: "Category 1",
      },
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const req = mockRequest("http://localhost/api?itemId=123");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);

    expect(data).toEqual({
      item: mockItem,
    });
  });

  it("should return 500 on server error", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    (prisma.item.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const req = mockRequest("http://localhost/api?itemId=123");

    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe("Internal Error");
  });
});