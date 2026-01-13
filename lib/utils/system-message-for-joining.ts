import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "../supabaseAdmin";

export const sendMessageForJoining = async (
    challengeId: string,
    userName: string,
    userId: string | null = null,
    type: "SYSTEM" | "USER" = "SYSTEM",
    joinedUserId: string | null = null
) => {
    try {
        const systemMessage = await prisma.challengeMessage.create({
            data: {
                challengeId,
                type,
                message: `${userName} joined the challenge 🎉`,
                userId,
                meta: {
                    action: "JOIN",
                    joinedUserId,
                    joinedUserName: userName,
                },
            },
        });
        await supabaseAdmin.channel(`challenge-chat-${challengeId}`).send({
            type: "broadcast",
            event: "new_message",
            payload: {
                ...systemMessage,
                user: null, // IMPORTANT: frontend expects this
            },
        });
    } catch (error) {
        console.error("Failed to send join message", error);
    }
};
