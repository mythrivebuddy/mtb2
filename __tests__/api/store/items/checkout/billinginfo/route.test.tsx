/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/user/store/items/checkout/billinginfo/route"; // 🔁 update path if needed
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GST_REGEX } from "@/lib/constant";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/auth.config", () => ({
  authConfig: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    userBillingInformation: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    billingInformation: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/constant", () => ({
  GST_REGEX: /^[0-9A-Z]{15}$/, // simple mock
}));

// ── Mock refs ────────────────────────────────────────────────────────────────

const mockSession = getServerSession as jest.Mock;
const mockFindUser = prisma.user.findUnique as jest.Mock;
const mockFindUserBilling = prisma.userBillingInformation.findUnique as jest.Mock;
const mockFindBilling = prisma.billingInformation.findUnique as jest.Mock;
const mockUpsert = prisma.userBillingInformation.upsert as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const USER = { id: "user-1", email: "test@test.com" };

function makePostRequest(body: any): NextRequest {
  return new NextRequest("http://localhost/api/billing", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 GET TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /billinginfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.mockResolvedValue({ user: USER });
    mockFindUser.mockResolvedValue({ id: "user-1" });
  });

  it("returns 401 if no session", async () => {
    mockSession.mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 if user not found", async () => {
    mockFindUser.mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns billing info from userBillingInformation", async () => {
    mockFindUserBilling.mockResolvedValueOnce({ id: "billing-1" });

    const res = await GET();
    const body = await res.json();

    expect(body.billingInfo).toEqual({ id: "billing-1" });
  });

  it("falls back to billingInformation if userBillingInformation is null", async () => {
    mockFindUserBilling.mockResolvedValueOnce(null);
    mockFindBilling.mockResolvedValueOnce({ id: "fallback-1" });

    const res = await GET();
    const body = await res.json();

    expect(body.billingInfo).toEqual({ id: "fallback-1" });
  });

  it("returns null if no billing info found anywhere", async () => {
    mockFindUserBilling.mockResolvedValueOnce(null);
    mockFindBilling.mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(body.billingInfo).toBeNull();
  });

  it("returns 500 on error", async () => {
    mockFindUser.mockRejectedValueOnce(new Error("fail"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔵 POST TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /billinginfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.mockResolvedValue({ user: USER });
    mockFindUser.mockResolvedValue({ id: "user-1" });
    mockUpsert.mockResolvedValue({ id: "billing-1" });
  });

  it("returns 401 if no session", async () => {
    mockSession.mockResolvedValueOnce(null);

    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns 404 if user not found", async () => {
    mockFindUser.mockResolvedValueOnce(null);

    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(404);
  });

  it("returns 400 if required fields missing", async () => {
    const res = await POST(makePostRequest({ city: "Mumbai" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid GST in India", async () => {
    const res = await POST(
      makePostRequest({
        addressLine1: "addr",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "IN",
        gstNumber: "INVALID",
      })
    );

    expect(res.status).toBe(400);
  });

  it("allows valid GST in India", async () => {
    const res = await POST(
      makePostRequest({
        addressLine1: "addr",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "IN",
        gstNumber: "22ABCDE1234F1Z5",
      })
    );

    expect(mockUpsert).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("allows GST validation skip for non-IN country", async () => {
    const res = await POST(
      makePostRequest({
        addressLine1: "addr",
        city: "NY",
        state: "NY",
        postalCode: "10001",
        country: "US",
        gstNumber: "INVALID",
      })
    );

    expect(res.status).toBe(200);
  });

  it("sets optional fields to null if missing", async () => {
    await POST(
      makePostRequest({
        addressLine1: "addr",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "IN",
      })
    );

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          phone: null,
          addressLine2: null,
          gstNumber: null,
        }),
      })
    );
  });

  it("returns billing info on success", async () => {
    const res = await POST(
      makePostRequest({
        addressLine1: "addr",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "IN",
      })
    );

    const body = await res.json();

    expect(body.billingInfo).toEqual({ id: "billing-1" });
  });

  it("returns 500 on error", async () => {
    mockUpsert.mockRejectedValueOnce(new Error("fail"));

    const res = await POST(
      makePostRequest({
        addressLine1: "addr",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "IN",
      })
    );

    expect(res.status).toBe(500);
  });
});