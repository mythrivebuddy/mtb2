// app/api/users/search/route.ts

import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const groupId = searchParams.get("groupId");

    if (!query || !groupId) {
      return NextResponse.json([]); // Return empty array if no query
    }
    
    // Find IDs of users already in the group
    const existingMembers = await prisma.groupMember.findMany({
        where: { groupId: groupId },
        select: { userId: true }
    });
    const existingMemberIds = existingMembers.map(m => m.userId);

    const users = await prisma.user.findMany({
      where: {
        // Find users who are NOT in the current group
        id: {
            notIn: existingMemberIds
        },
        // And match the search query
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10, // Limit results for performance
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USER_SEARCH]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}