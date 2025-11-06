import { authOptions } from "@/lib/auth";
import { checkRole } from "@/lib/utils/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const GET = async (req: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized, Kindly login first" },
        { status: 401 }
      );
    }

    await checkRole("ADMIN", "You are not authorized for this action");

    // ✅ Pagination + search params
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 10);
    const search = searchParams.get("search")?.trim() || "";

    const skip = (page - 1) * pageSize;

    // ✅ Search filter (typed correctly)
    const where = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    // ✅ Count after applying search
    const totalCount = await prisma.group.count({ where });

    // ✅ Typed findMany (fixes TS errors)
    const groups = await prisma.group.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        members: true,
        User_Group_creatorIdToUser: { select: { name: true } },
      },
    });

    const formatted = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      memberCount: g.members.length,
      createdBy: g.User_Group_creatorIdToUser?.name ?? "Unknown",
      isBlocked: g.isBlocked ?? false,
    }));

    return NextResponse.json({
      groups: formatted,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      page,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
};
