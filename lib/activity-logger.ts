// lib/activity-logger.ts
import { prisma } from "@/lib/prisma";
import { supabaseClient } from "@/lib/supabaseClient";
import { ActivityFeedType } from "@prisma/client"; // <-- 1. Import the enum type

// A mapping for icons based on activity type (this remains the same)
const iconMap = {
  group_created: "cycle",
  member_added: "goal",
  goal_updated: "update",
  comment_posted: "comment",
  status_updated: "result",
} as const;

// This internal type definition also remains the same
type ActivityType = keyof typeof iconMap;

// <-- 2. Create a map to translate internal types to database enum types
const typeToEnumMap: Record<ActivityType, ActivityFeedType> = {
  group_created: ActivityFeedType.GROUP_CREATED,
  member_added: ActivityFeedType.USER_JOINED_GROUP,
  goal_updated: ActivityFeedType.GOAL_UPDATED,
  comment_posted: ActivityFeedType.COMMENT_ADDED,
  status_updated: ActivityFeedType.STATUS_UPDATED,
};

export async function logActivity(
  groupId: string,
  type: ActivityType,
  details: string,
  actorId: string // <-- Add actorId as a required parameter
) {
  try {
    // 3. Get the correct database enum value from our new map
    const dbActivityType = typeToEnumMap[type];

    // 4. Save the activity to the database using the correct enum type
    const newActivity = await prisma.activityFeedItem.create({
      data: {
        groupId,
        type: dbActivityType, // <-- Use the mapped enum value here
        details,
        actorId, // <-- Pass actorId here
      },
    });

    // 5. Broadcast the new activity via Supabase for real-time updates
    const channel = supabaseClient.channel(`acc-group-${groupId}`);

    // The payload uses the original 'type' for the icon, which is correct.
    const payload = {
      id: newActivity.id,
      icon: iconMap[type],
      title: newActivity.details,
      time: "Just now", // Frontend will show this until next reload
    };

    await channel.send({
      type: "broadcast",
      event: "feed",
      payload,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}