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

export async function createWeeklyWinMessage(
userId: string,
  challengeId: string,
  message: string,
  type: "SYSTEM" | "USER" = "USER",
) {
  return prisma.challengeMessage.create({
    data: {
      message,
      challengeId,
      userId,
      type
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      challenge: { select: { title: true, joinMode: true } },
    },
  });
}
