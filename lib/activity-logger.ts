
// lib/activity-logger.ts
import { prisma } from "@/lib/prisma";
import { supabaseClient } from "@/lib/supabaseClient"; 


// A mapping for icons based on activity type
const iconMap = {
    group_created: "cycle",
    member_added: "goal",
    goal_updated: "update",
    comment_posted: "comment",
    status_updated: "result"
} as const;

type ActivityType = keyof typeof iconMap;


export async function logActivity(
    groupId: string,
    type: ActivityType,
    details: string
) {
    try {
        // 1. Save the activity to the database
        const newActivity = await prisma.activityFeedItem.create({
            data: {
                groupId,
                type,
                details,
            },
        });

        // 2. Broadcast the new activity via Supabase for real-time updates
        const channel = supabaseClient.channel(`acc-group-${groupId}`);
        
        // The payload should match the shape expected by the frontend hook
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