import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Groups the user created
    const createdGroups = await prisma.group.findMany({
      where: { creatorId: userId },
      include: {
        members: {
          include: { user: true },
        },
        cycles: true,
      },
    });

    // Groups the user joined (but not created)
    const joinedGroups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
        NOT: {
          creatorId: userId, //  exclude groups the user created
        },
      },
      include: {
        members: {
          include: { user: true },
        },
        cycles: true,
      },
    });

    return NextResponse.json({
      createdGroups,
      joinedGroups,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
