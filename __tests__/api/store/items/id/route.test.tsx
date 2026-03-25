/**
 * @jest-environment node
 */

import { PUT, DELETE } from "@/app/api/user/store/items/[id]/route"; // 🔁 update path
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload-admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("@/lib/utils/supabase-image-upload-admin", () => jest.fn());

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn().mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

// ── Mock refs ────────────────────────────────────────────────────────────────

const mockSession = getServerSession as jest.Mock;
const mockFindItem = prisma.item.findUnique as jest.Mock;
const mockUpdateItem = prisma.item.update as jest.Mock;
const mockDeleteItem = prisma.item.delete as jest.Mock;
const mockUpload = handleSupabaseImageUpload as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const USER = { id: "user-1", role: "USER" };
const ADMIN = { id: "admin-1", role: "ADMIN" };

function makeFormRequest(fields: Record<string, any>): NextRequest {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));

  return new NextRequest("http://localhost", {
    method: "PUT",
    body: fd,
  });
}

const EXISTING_ITEM = {
  imageUrl: "https://test.supabase.co/object/public/store-images/store-images/old.png",
  downloadUrl: "https://test.supabase.co/object/public/store-images/store-images/file.zip",
  createdByUserId: "user-1",
  currency: "INR",
  isApproved: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// 🟡 PUT TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("PUT /items/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSession.mockResolvedValue({ user: USER });
    mockFindItem.mockResolvedValue(EXISTING_ITEM);
    mockUpdateItem.mockResolvedValue({ id: "item-1" });
    mockUpload.mockResolvedValue("new-url");
  });

  it("returns 401 if no session", async () => {
    mockSession.mockResolvedValueOnce(null);

    const res = await PUT(makeFormRequest({}), { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 if item not found", async () => {
    mockFindItem.mockResolvedValueOnce(null);

    const res = await PUT(makeFormRequest({}), { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 if not owner or admin", async () => {
    mockSession.mockResolvedValueOnce({ user: { id: "other", role: "USER" } });

    const res = await PUT(makeFormRequest({}), { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for missing fields", async () => {
    const res = await PUT(
      makeFormRequest({ name: "", category: "", basePrice: "" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("updates item successfully (owner)", async () => {
    const res = await PUT(
      makeFormRequest({
        name: "Test",
        category: "cat-1",
        basePrice: "10",
      }),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(mockUpdateItem).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("resets approval if not admin", async () => {
    await PUT(
      makeFormRequest({
        name: "Test",
        category: "cat-1",
        basePrice: "10",
      }),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(mockUpdateItem).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isApproved: false,
        }),
      })
    );
  });

  it("does NOT reset approval if admin", async () => {
    mockSession.mockResolvedValueOnce({ user: ADMIN });

    await PUT(
      makeFormRequest({
        name: "Test",
        category: "cat-1",
        basePrice: "10",
      }),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(mockUpdateItem).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          isApproved: false,
        }),
      })
    );
  });

  it("uploads new image if provided", async () => {
    const file = new File(["img"], "img.png");

    await PUT(
      makeFormRequest({
        name: "Test",
        category: "cat-1",
        basePrice: "10",
        image: file,
      }),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(mockUpload).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockFindItem.mockRejectedValueOnce(new Error("fail"));

    const res = await PUT(makeFormRequest({}), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(500);
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 🔴 DELETE TESTS
// // ─────────────────────────────────────────────────────────────────────────────
// 🔴 DELETE TESTS
// ─────────────────────────────────────────────────────────────────────────────

function makeDeleteRequest(): NextRequest {
  return new NextRequest("http://localhost/api/items/1", {
    method: "DELETE",
  });
}

describe("DELETE /items/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSession.mockResolvedValue({ user: USER });
    mockFindItem.mockResolvedValue(EXISTING_ITEM);
    mockDeleteItem.mockResolvedValue({});
  });

  it("returns 401 if not authenticated", async () => {
    mockSession.mockResolvedValueOnce(null);

    const res = await DELETE(makeDeleteRequest(), { params: { id: "1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 if item not found", async () => {
    mockFindItem.mockResolvedValueOnce(null);

    const res = await DELETE(makeDeleteRequest(), { params: { id: "1" } });
    expect(res.status).toBe(404);
  });

  it("returns 403 if not owner/admin", async () => {
    mockSession.mockResolvedValueOnce({ user: { id: "x", role: "USER" } });

    const res = await DELETE(makeDeleteRequest(), { params: { id: "1" } });
    expect(res.status).toBe(403);
  });

  it("deletes item successfully", async () => {
    const res = await DELETE(makeDeleteRequest(), { params: { id: "1" } });

    expect(mockDeleteItem).toHaveBeenCalledWith({
      where: { id: "1" },
    });

    expect(res.status).toBe(200);
  });

  it("returns 500 if prisma fails", async () => {
    mockDeleteItem.mockRejectedValueOnce(new Error("fail"));

    const res = await DELETE(makeDeleteRequest(), { params: { id: "1" } });
    expect(res.status).toBe(500);
  });
});