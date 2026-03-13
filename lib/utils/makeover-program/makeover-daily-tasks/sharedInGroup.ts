import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MessageType } from "@prisma/client";

export const sharedInChallengeGroup = async (userId: string, content: string, challengeId: string) => {
    const message = await prisma.challengeMessage.create({
        data: {
            message: content,
            challengeId,
            userId,
            type: MessageType.USER
        },
        include: {
            user: { select: { id: true, name: true, image: true } },
            challenge: { select: { title: true, joinMode: true } },
        },
    });
    await supabaseAdmin.channel(`challenge-chat-${challengeId}`).send({
        type: "broadcast",
        event: "new_message",
        payload: {
            ...message,
            user: message.user, // IMPORTANT: frontend expects this
        },
    });

};
