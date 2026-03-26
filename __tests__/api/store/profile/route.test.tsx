import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/user/store/profile/route";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/app/api/auth/[...nextauth]/auth.config", () => ({
  authConfig: {},
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;

describe("GET /api/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Auth guard ---

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no user", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: null } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session user has no email", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { email: null } } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // --- User lookup ---

  it("returns 404 when user is not found in the database", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { email: "test@example.com" },
    } as any);
    mockFindUnique.mockResolvedValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      select: {
        id: true,
        email: true,
        planId: true,
        planStart: true,
        planEnd: true,
        jpBalance: true,
        createdAt: true,
      },
    });
  });

  // --- Happy path ---

it("returns 200 with user data on success", async () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    planId: "plan-pro",
    planStart: new Date("2024-01-01"),
    planEnd: new Date("2025-01-01"),
    jpBalance: 500,
    createdAt: new Date("2023-06-15"),
  };

  mockGetServerSession.mockResolvedValueOnce({
    user: { email: "test@example.com" },
  } as any);
  mockFindUnique.mockResolvedValueOnce(mockUser as any);

  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  // ✅ Dates become ISO strings after JSON serialization
  expect(body).toEqual({
    user: {
      ...mockUser,
      planStart: mockUser.planStart.toISOString(),
      planEnd: mockUser.planEnd.toISOString(),
      createdAt: mockUser.createdAt.toISOString(),
    },
  });
});

  it("queries prisma with the correct email from the session", async () => {
    const email = "specific@example.com";
    mockGetServerSession.mockResolvedValueOnce({ user: { email } } as any);
    mockFindUnique.mockResolvedValueOnce({ id: "u1", email } as any);

    await GET();

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email } })
    );
  });

  // --- Error handling ---

  it("returns 500 when getServerSession throws", async () => {
    mockGetServerSession.mockRejectedValueOnce(new Error("Auth service down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });

  it("returns 500 when prisma throws", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { email: "test@example.com" },
    } as any);
    mockFindUnique.mockRejectedValueOnce(new Error("DB connection failed"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
  });
});