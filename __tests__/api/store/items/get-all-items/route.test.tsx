/**
 * @jest-environment node
 */

import { GET } from "@/app/api/user/store/items/get-all-items/route"; // 🔁 update path
import { prisma } from "@/lib/prisma";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany: jest.fn(),
    },
  },
}));

// ── Mock refs ────────────────────────────────────────────────────────────────

const mockFindMany = prisma.item.findMany as jest.Mock;

// ── Test Data ─────────────────────────────────────────────────────────────────

const MOCK_ITEMS = [
  {
    id: "item-1",
    name: "Item 1",
    createdAt: new Date(),
    category: {
      id: "cat-1",
      name: "Category 1",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /get-all-items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Success ────────────────────────────────────────────────────────────────

  it("returns items successfully", async () => {
    mockFindMany.mockResolvedValue(MOCK_ITEMS);

    const res = await GET();
    const body = await res.json();

    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    expect(res.status).toBe(200);

    expect(body).toEqual({
      success: true,
      items: [
        {
          ...MOCK_ITEMS[0],
          createdAt: MOCK_ITEMS[0].createdAt.toISOString(), // ✅ FIX
        },
      ],
    });
  });

  it("returns empty array when no items exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      items: [],
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("returns 500 when prisma throws", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("DB error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      success: false,
      message: "Failed to fetch items",
    });
  });
});