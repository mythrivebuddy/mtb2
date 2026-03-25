/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { POST } from "@/app/api/user/store/items/add-items/route";

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@/lib/utils/supabase-image-upload-admin", () => jest.fn());

jest.mock("@prisma/client", () => {
  const mockCreate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      item: { create: mockCreate },
    })),
    __mockCreate: mockCreate, // expose for assertions
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────────

const mockGetServerSession    = getServerSession    as jest.MockedFunction<typeof getServerSession>;
const mockImageUpload         = handleSupabaseImageUpload as jest.MockedFunction<typeof handleSupabaseImageUpload>;

// Pull the shared mockCreate reference out of the mocked module
const { __mockCreate: mockPrismaCreate } = jest.requireMock("@prisma/client");

const MOCK_SESSION = { user: { id: "user-123", email: "test@example.com" } };

const BASE_ITEM = {
  id:            "item-abc",
  name:          "Test Item",
  categoryId:    "cat-1",
  basePrice:     99.99,
  monthlyPrice:  9.99,
  yearlyPrice:   99.0,
  lifetimePrice: 299.0,
  currency:      "INR",
  imageUrl:      "https://cdn.example.com/image.png",
  downloadUrl:   null,
  isApproved:    false,
  createdAt:     new Date("2024-01-15T10:00:00.000Z"),
};

/** Build a NextRequest with a FormData body */
function makeRequest(fields: Record<string, string | File>): NextRequest {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return new NextRequest("http://localhost/api/user/store/items/add-items", {
    method: "POST",
    body: fd,
  });
}

/** Minimal valid form fields */
function validFields(overrides: Record<string, string | File> = {}): Record<string, string | File> {
  return {
    name:     "Test Item",
    category: "cat-1",
    basePrice: "99.99",
    image:    new File(["img"], "image.png", { type: "image/png" }),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("POST /api/user/store/items/add-items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(MOCK_SESSION as any);
    mockImageUpload.mockResolvedValue("https://cdn.example.com/image.png");
    mockPrismaCreate.mockResolvedValue(BASE_ITEM);
  });

  // ── Auth ────────────────────────────────────────────────────────────────────

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no user", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: null } as any);
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it("returns 400 when name is missing", async () => {
    const res  = await POST(makeRequest(validFields({ name: "" })));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Missing required fields" });
  });

  it("returns 400 when category is missing", async () => {
    const res  = await POST(makeRequest(validFields({ category: "" })));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Missing required fields" });
  });

  it("returns 400 when basePrice is not a number", async () => {
    const res  = await POST(makeRequest(validFields({ basePrice: "not-a-number" })));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Missing required fields" });
  });

  it("returns 400 when image is missing", async () => {
    const fields = { name: "Test", category: "cat-1", basePrice: "10" };
    const res    = await POST(makeRequest(fields));
    const body   = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Missing required fields" });
  });

  // ── Currency ────────────────────────────────────────────────────────────────

  it("defaults currency to INR when not provided", async () => {
    await POST(makeRequest(validFields()));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: "INR" }) })
    );
  });

  it("accepts USD currency", async () => {
    await POST(makeRequest(validFields({ currency: "USD" })));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: "USD" }) })
    );
  });

  it("accepts GP currency", async () => {
    await POST(makeRequest(validFields({ currency: "GP" })));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: "GP" }) })
    );
  });

  it("falls back to INR for an invalid currency", async () => {
    await POST(makeRequest(validFields({ currency: "XYZ" })));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: "INR" }) })
    );
  });

  // ── Optional price fields ───────────────────────────────────────────────────

  it("defaults optional prices to 0 when omitted", async () => {
    await POST(makeRequest(validFields()));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monthlyPrice:  0,
          yearlyPrice:   0,
          lifetimePrice: 0,
        }),
      })
    );
  });

  it("passes optional prices when provided", async () => {
    await POST(makeRequest(validFields({
      monthlyPrice:  "9.99",
      yearlyPrice:   "99.00",
      lifetimePrice: "299.00",
    })));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monthlyPrice:  9.99,
          yearlyPrice:   99.00,
          lifetimePrice: 299.00,
        }),
      })
    );
  });

  // ── Image upload ────────────────────────────────────────────────────────────

// replace these two tests only

it("calls image upload with the image file", async () => {
  const imageFile = new File(["img"], "photo.png", { type: "image/png" });
  await POST(makeRequest(validFields({ image: imageFile })));
  expect(mockImageUpload).toHaveBeenCalledWith(
    expect.objectContaining({ name: "photo.png", type: "image/png", size: 3 }),
    "store-images",
    "store-images"
  );
});

it("uploads download file when provided and non-empty", async () => {
  const downloadFile = new File(["zip-content"], "asset.zip", { type: "application/zip" });
  await POST(makeRequest(validFields({ download: downloadFile })));
  expect(mockImageUpload).toHaveBeenCalledTimes(2);
  expect(mockImageUpload).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ name: "asset.zip", type: "application/zip", size: 11 }),
    "store-images",
    "store-images"
  );
});

  it("does not upload download file when not provided", async () => {
    await POST(makeRequest(validFields()));
    expect(mockImageUpload).toHaveBeenCalledTimes(1); // only image
  });



  // ── Prisma call ─────────────────────────────────────────────────────────────

  it("creates item with correct data including session user id", async () => {
    await POST(makeRequest(validFields()));
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name:            "Test Item",
          categoryId:      "cat-1",
          basePrice:       99.99,
          isApproved:      false,
          createdByUserId: "user-123",
          createdByRole:   "USER",
          imageUrl:        "https://cdn.example.com/image.png",
        }),
      })
    );
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns 201 with item and success message", async () => {
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toBe("Item created successfully. Pending admin approval.");
    expect(body.item).toMatchObject({
      id:        "item-abc",
      name:      "Test Item",
      category:  "cat-1",           // mapped from categoryId
      createdAt: "2024-01-15T10:00:00.000Z", // serialised to ISO string
    });
  });

  it("maps categoryId to category in the response", async () => {
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(body.item.category).toBe(BASE_ITEM.categoryId);
  });

  it("serialises createdAt to an ISO string in the response", async () => {
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(body.item.createdAt).toBe(BASE_ITEM.createdAt.toISOString());
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  it("returns 500 when image upload throws", async () => {
    mockImageUpload.mockRejectedValueOnce(new Error("Supabase error"));
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to create item" });
  });

  it("returns 500 when prisma throws", async () => {
    mockPrismaCreate.mockRejectedValueOnce(new Error("DB error"));
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to create item" });
  });

  it("returns 500 when getServerSession throws", async () => {
    mockGetServerSession.mockRejectedValueOnce(new Error("Auth error"));
    const res  = await POST(makeRequest(validFields()));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to create item" });
  });
});