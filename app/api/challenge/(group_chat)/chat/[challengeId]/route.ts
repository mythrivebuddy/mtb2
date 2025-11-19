import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = await params;

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.challengeMessage.findMany({
      where: { challengeId },   // ✅ MUST BE challengeId
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
  select: {
    emoji: true,
    userId: true,
    // 👇 UPDATE THIS LINE to include 'image'
    user: { select: { name: true, image: true } } 
  }
}
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching chat messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
