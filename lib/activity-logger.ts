// lib/activity-logger.ts
import { prisma } from "@/lib/prisma";
import { supabaseClient } from "@/lib/supabaseClient";
import { ActivityFeedType } from "@prisma/client";

// A mapping for icons based on activity type (keys are lowercase for convenience)
const iconMap = {
    group_created: "cycle",
    member_added: "goal",
    goal_updated: "update",
    comment_posted: "comment",
    status_updated: "result",
    cycle_started: "cycle",
    group_leave: "group_leave",
} as const;

// Local type for function parameters, derived from our lowercase keys
type ActivityLogType = keyof typeof iconMap;

// ✅ FIX: A mapping from our convenient lowercase types to the required uppercase Prisma Enum types.
const typeToEnumMap: Record<ActivityLogType, ActivityFeedType> = {
    group_created: ActivityFeedType.GROUP_CREATED,
    member_added: ActivityFeedType.USER_JOINED_GROUP, // Assuming this is the correct mapping
    goal_updated: ActivityFeedType.GOAL_UPDATED,
    comment_posted: ActivityFeedType.COMMENT_ADDED, // Assuming this is the correct mapping
    status_updated: ActivityFeedType.STATUS_UPDATED,
    cycle_started: ActivityFeedType.CYCLE_STARTED,
    group_leave: ActivityFeedType.GROUP_LEAVE, // Added mapping for 'leave' activity
};

export async function logActivity(
    groupId: string,
    // ✅ FIX: Added the required 'actorId' parameter.
    actorId: string,
    type: ActivityLogType,
    details: string
) {
    try {
        // 1. Save the activity to the database
        const newActivity = await prisma.activityFeedItem.create({
            data: {
                groupId,
                actorId, // Pass the actorId to the database
                // ✅ FIX: Use the map to provide the correct uppercase enum value.
                type: typeToEnumMap[type],
                // Store details as a JSON object to match the schema
                details: { message: details },
            },
        });

        // 2. Broadcast the new activity via Supabase for real-time updates
        const channel = supabaseClient.channel(`acc-group-${groupId}`);
        
        const payload = {
            id: newActivity.id,
            icon: iconMap[type],
            // Extract the message from the details JSON
            title: details,
            time: "Just now",
        };

        await channel.send({
            type: "broadcast",
            event: "new_activity", // Using a more specific event name
            payload,
        });

    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
