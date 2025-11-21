-- CreateTable
CREATE TABLE "public"."ChallengeMessageReaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "ChallengeMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeMessageReaction_messageId_idx" ON "public"."ChallengeMessageReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMessageReaction_userId_messageId_emoji_key" ON "public"."ChallengeMessageReaction"("userId", "messageId", "emoji");

-- AddForeignKey
ALTER TABLE "public"."ChallengeMessageReaction" ADD CONSTRAINT "ChallengeMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeMessageReaction" ADD CONSTRAINT "ChallengeMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."challenge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
