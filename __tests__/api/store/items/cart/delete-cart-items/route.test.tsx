/**
 * @jest-environment node
 */

import { DELETE } from "@/app/api/user/store/items/cart/delete-cart-items/route"; // 🔁 update path
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
    cart: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    wishlist: {
      create: jest.fn(),
    },
  },
}));

// ── Mock refs ────────────────────────────────────────────────────────────────

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

const mockFindCart = prisma.cart.findUnique as jest.Mock;
const mockDeleteCart = prisma.cart.delete as jest.Mock;
const mockWishlistCreate = prisma.wishlist.create as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: "user-123", email: "test@example.com" },
};

function makeRequest(body: any): NextRequest {
  return new NextRequest("http://localhost/api/cart/delete", {
    method: "DELETE",
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DELETE /api/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetServerSession.mockResolvedValue(MOCK_SESSION as any);

    mockFindCart.mockResolvedValue({
      id: "cart-1",
      userId: "user-123",
      itemId: "item-1",
      wasInWishlist: false,
    });

    mockDeleteCart.mockResolvedValue({});
    mockWishlistCreate.mockResolvedValue({});
  });

  // ── Auth ───────────────────────────────────────────────────────────────────

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await DELETE(makeRequest({ cartItemId: "cart-1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no user", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: null } as any);

    const res = await DELETE(makeRequest({ cartItemId: "cart-1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it("returns 400 when cartItemId is missing", async () => {
    const res = await DELETE(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Item ID is required" });
  });

  // ── Cart lookup ────────────────────────────────────────────────────────────

  it("returns 404 when cart item not found", async () => {
    mockFindCart.mockResolvedValueOnce(null);

    const res = await DELETE(makeRequest({ cartItemId: "cart-1" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Cart item not found" });
  });

  // ── Delete logic ───────────────────────────────────────────────────────────

  it("deletes cart item successfully", async () => {
    const res = await DELETE(makeRequest({ cartItemId: "cart-1" }));
    const body = await res.json();

    expect(mockDeleteCart).toHaveBeenCalledWith({
      where: {
        id: "cart-1",
        userId: "user-123",
      },
    });

    expect(res.status).toBe(200);
    expect(body).toEqual({ message: "Item removed from cart" });
  });

  // ── Wishlist logic ─────────────────────────────────────────────────────────

  it("adds item back to wishlist if wasInWishlist is true", async () => {
    mockFindCart.mockResolvedValueOnce({
      id: "cart-1",
      userId: "user-123",
      itemId: "item-1",
      wasInWishlist: true,
    });

    await DELETE(makeRequest({ cartItemId: "cart-1" }));

    expect(mockWishlistCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        itemId: "item-1",
      },
    });
  });

  it("does not add to wishlist if wasInWishlist is false", async () => {
    mockFindCart.mockResolvedValueOnce({
      id: "cart-1",
      userId: "user-123",
      itemId: "item-1",
      wasInWishlist: false,
    });

    await DELETE(makeRequest({ cartItemId: "cart-1" }));

    expect(mockWishlistCreate).not.toHaveBeenCalled();
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("returns 500 when prisma throws", async () => {
    mockFindCart.mockRejectedValueOnce(new Error("DB error"));

    const res = await DELETE(makeRequest({ cartItemId: "cart-1" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });

  it("returns 500 when getServerSession throws", async () => {
    mockGetServerSession.mockRejectedValueOnce(new Error("Auth error"));

    const res = await DELETE(makeRequest({ cartItemId: "cart-1" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});