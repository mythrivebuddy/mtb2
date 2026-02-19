// app/api/challenge/chat/send/route.ts
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { notifyUsersExcept } from "@/lib/utils/pushNotifications";
import { ChallengeJoinMode } from "@prisma/client";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";
import { getLimitPeriodStart } from "@/lib/access-control/limitPeriod";
import { LimitType } from "@/lib/access-control/featureConfig";


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId, message, replyToId } = await req.json();

    if (!challengeId || !message?.trim()) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const feature = checkFeature({
      feature: "challenges",
      user: session.user,
    });

    if (!feature.allowed) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const config = feature.config;
    const { groupChatLimit, limitType, isUpgradeFlagShow } = config as {
      groupChatLimit: number;
      limitType: LimitType;
      isUpgradeFlagShow?: boolean;
    };

    // ⏱️ Count messages
    let periodStart: Date | null = null;
    if (groupChatLimit !== -1) {
      periodStart = getLimitPeriodStart(limitType);
    }

    const messageCount = groupChatLimit === -1
      ? 0
      : await prisma.challengeMessage.count({
        where: {
          challengeId,
          userId: session.user.id,
          ...(periodStart && {
            createdAt: { gte: periodStart },
          }),
        },
      });

    const limitLabel =
      limitType === "MONTHLY"
        ? "per month"
        : limitType === "YEARLY"
          ? "per year"
          : "in total";

    const limitResponse = await enforceLimitResponse({
      limit: groupChatLimit,
      currentCount: messageCount,
      message: `You have reached your group chat message limit (${groupChatLimit} ${limitLabel}).${isUpgradeFlagShow ? " Please upgrade to increase the limit." : ""
        }`,

    });

    if (limitResponse) {
      return limitResponse;
    }


    // 2. Create the message just as before
    const newMessage = await prisma.challengeMessage.create({
      data: {
        message,
        challengeId,
        userId: user.id,
        replyToId: replyToId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        challenge: { select: { title: true, joinMode: true } },
        replyTo: {
          select: {
            id: true,
            message: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    // 3. ✨ BROADCAST THE NEW MESSAGE
    // Use the admin client to send the full message object
    const channel = supabaseAdmin.channel(`challenge-chat-${challengeId}`);
    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: newMessage, // Send the full message with user data
    });

    let from = "";
    if (newMessage.challenge.joinMode === ChallengeJoinMode.SYSTEM_ONLY) {
      from = "?from=dashboard%2Fcomplete-makeover-program%2Fmakeover-dashboard";
    }

    const senderName = newMessage.user?.name ?? "Someone";
    const body =
      message.length > 120 ? message.slice(0, 117) + "…" : message;

    void notifyUsersExcept({
      challengeId,
      title: `${senderName} in ${newMessage.challenge.title}`,
      message: body,
      url: `${process.env.NEXT_URL}/dashboard/challenge/my-challenges/${challengeId}${from}`,
      notTosendUserItself: user.id,
    });


    // 4. Return the new message to the sender
    return NextResponse.json(newMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}