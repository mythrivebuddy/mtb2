/**
 * @jest-environment node
 */

import { GET } from "@/app/api/user/store/items/cart/get-cart-items/route"; // 🔁 update path if needed
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/auth.config", () => ({
  authConfig: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    cart: {
      findMany: jest.fn(),
    },
  },
}));

// ── Mock refs ────────────────────────────────────────────────────────────────

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockFindMany = prisma.cart.findMany as jest.Mock;

// ── Test Data ─────────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: "user-123", email: "test@example.com" },
};

const MOCK_CART_ITEMS = [
  {
    id: "cart-1",
    userId: "user-123",
    itemId: "item-1",
    item: {
      id: "item-1",
      name: "Test Item",
      category: {
        id: "cat-1",
        name: "Category 1",
      },
    },
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetServerSession.mockResolvedValue(MOCK_SESSION as any);
    mockFindMany.mockResolvedValue(MOCK_CART_ITEMS);
  });

  // ── Auth ───────────────────────────────────────────────────────────────────

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no user id", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: {} } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // ── Success ────────────────────────────────────────────────────────────────

  it("returns cart items successfully", async () => {
    const res = await GET();
    const body = await res.json();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    expect(res.status).toBe(200);
    expect(body).toEqual({ cart: MOCK_CART_ITEMS });
  });

  it("returns empty cart when no items exist", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ cart: [] });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("returns 500 when prisma throws", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("DB error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });

  it("returns 500 when getServerSession throws", async () => {
    mockGetServerSession.mockRejectedValueOnce(new Error("Auth error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});