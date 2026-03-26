/**
 * @jest-environment node
 */

import { GET } from "@/app/api/user/store/items/get-categories/route"; // 🔁 update path if needed
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ── Mock Prisma ───────────────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
    },
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/category/get-all", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return categories successfully", async () => {
    const mockCategories = [
      { id: "1", name: "Electronics" },
      { id: "2", name: "Clothing" },
    ];

    (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    expect(data).toEqual({
      categories: mockCategories,
    });

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
      },
    });
  });

  it("should handle errors and return 500", async () => {
    (prisma.category.findMany as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Failed to fetch categories",
    });

    expect(prisma.category.findMany).toHaveBeenCalled();
  });
});