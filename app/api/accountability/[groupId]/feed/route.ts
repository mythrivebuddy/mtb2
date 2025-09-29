// app/api/accountability/[groupId]/feed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

const iconMap = {
    group_created: "cycle",
    member_added: "goal",
    goal_updated: "update",
    comment_posted: "comment",
    status_updated: "result"
} as const;

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = await params;
    const activities = await prisma.activityFeedItem.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 20, // Get the 20 most recent activities
    });

    // Format the data to match the frontend's expectation
    const formattedItems = activities.map((item) => ({
      id: item.id,
      icon: iconMap[item.type as keyof typeof iconMap] || "update",
      title: item.details,
      time: formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error(`[GET_FEED]`, error);
    return NextResponse.json({ items: [] }); // Return empty on error
  }
}