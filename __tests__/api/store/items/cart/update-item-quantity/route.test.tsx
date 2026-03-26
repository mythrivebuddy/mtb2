/**
 * @jest-environment node
 */

import { PUT } from "@/app/api/user/store/items/cart/update-item-quantity/route"; // 🔁 update path if needed
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
      update: jest.fn(),
    },
  },
}));

// ── Mock refs ────────────────────────────────────────────────────────────────

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockUpdateCart = prisma.cart.update as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: "user-123", email: "test@example.com" },
};

function makeRequest(body: any): NextRequest {
  return new NextRequest("http://localhost/api/cart/update", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PUT /api/cart/update", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetServerSession.mockResolvedValue(MOCK_SESSION as any);

    mockUpdateCart.mockResolvedValue({
      id: "cart-1",
      userId: "user-123",
      itemId: "item-1",
      quantity: 2,
    });
  });

  // ── Auth ───────────────────────────────────────────────────────────────────

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: 2 }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no user", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: null } as any);

    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: 2 }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it("returns 400 when cartItemId is missing", async () => {
    const res = await PUT(makeRequest({ quantity: 2 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid cartItemId or quantity" });
  });

  it("returns 400 when quantity is not a number", async () => {
    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: "2" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid cartItemId or quantity" });
  });

  it("returns 400 when quantity is less than 1", async () => {
    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: 0 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid cartItemId or quantity" });
  });

  // ── Success ────────────────────────────────────────────────────────────────

  it("updates cart quantity successfully", async () => {
    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: 2 }));
    const body = await res.json();

    expect(mockUpdateCart).toHaveBeenCalledWith({
      where: {
        id: "cart-1",
        userId: "user-123",
      },
      data: {
        quantity: 2,
      },
    });

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      message: "Quantity updated successfully",
      cartItem: {
        id: "cart-1",
        quantity: 2,
      },
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("returns 500 when prisma throws", async () => {
    mockUpdateCart.mockRejectedValueOnce(new Error("DB error"));

    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: 2 }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("returns 500 when getServerSession throws", async () => {
    mockGetServerSession.mockRejectedValueOnce(new Error("Auth error"));

    const res = await PUT(makeRequest({ cartItemId: "cart-1", quantity: 2 }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});