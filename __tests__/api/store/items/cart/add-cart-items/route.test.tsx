/**
 * @jest-environment node
 */

import { POST } from "@/app/api/user/store/items/cart/add-cart-items/route"; // 🔁 update path if needed
import { NextRequest } from "next/server";
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
    item: {
      findUnique: jest.fn(),
    },
    cart: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// ── Mock references ───────────────────────────────────────────────────────────

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

const mockFindItem = prisma.item.findUnique as jest.Mock;
const mockFindCart = prisma.cart.findFirst as jest.Mock;
const mockCreateCart = prisma.cart.create as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: "user-123", email: "test@example.com" },
};

function makeRequest(body: any): NextRequest {
  return new NextRequest("http://localhost/api/cart/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/cart/add", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetServerSession.mockResolvedValue(MOCK_SESSION as any);

    mockFindItem.mockResolvedValue({
      id: "item-1",
      name: "Test Item",
    });

    mockFindCart.mockResolvedValue(null);

    mockCreateCart.mockResolvedValue({
      id: "cart-1",
      userId: "user-123",
      itemId: "item-1",
      wasInWishlist: false,
    });
  });

  // ── Auth ───────────────────────────────────────────────────────────────────

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ itemId: "item-1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no user", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: null } as any);

    const res = await POST(makeRequest({ itemId: "item-1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it("returns 400 when itemId is missing", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: "Item ID is required and must be a string",
    });
  });

  it("returns 400 when itemId is not a string", async () => {
    const res = await POST(makeRequest({ itemId: 123 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: "Item ID is required and must be a string",
    });
  });

  // ── Item checks ────────────────────────────────────────────────────────────

  it("returns 404 when item does not exist", async () => {
    mockFindItem.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ itemId: "item-1" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Item not found" });
  });

  // ── Cart logic ─────────────────────────────────────────────────────────────

  it("returns 400 when item already exists in cart", async () => {
    mockFindCart.mockResolvedValueOnce({
      id: "cart-1",
    });

    const res = await POST(makeRequest({ itemId: "item-1" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ message: "Item already in cart" });
  });

  // ── Create cart item ───────────────────────────────────────────────────────

  it("creates cart item successfully", async () => {
    const res = await POST(
      makeRequest({ itemId: "item-1", wasInWishlist: true })
    );
    const body = await res.json();

    expect(mockCreateCart).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        itemId: "item-1",
        wasInWishlist: true,
      },
    });

    expect(res.status).toBe(201);
    expect(body.cartItem).toMatchObject({
      id: "cart-1",
      itemId: "item-1",
    });
  });

  it("defaults wasInWishlist to false", async () => {
    await POST(makeRequest({ itemId: "item-1" }));

    expect(mockCreateCart).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        itemId: "item-1",
        wasInWishlist: false,
      },
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("returns 500 when prisma throws", async () => {
    mockFindItem.mockRejectedValueOnce(new Error("DB error"));

    const res = await POST(makeRequest({ itemId: "item-1" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });

  it("returns 500 when getServerSession throws", async () => {
    mockGetServerSession.mockRejectedValueOnce(new Error("Auth error"));

    const res = await POST(makeRequest({ itemId: "item-1" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});