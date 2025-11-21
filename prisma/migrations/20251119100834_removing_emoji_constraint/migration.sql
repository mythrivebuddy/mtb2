/*
  Warnings:

  - A unique constraint covering the columns `[userId,messageId]` on the table `ChallengeMessageReaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ChallengeMessageReaction_userId_messageId_emoji_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMessageReaction_userId_messageId_key" ON "public"."ChallengeMessageReaction"("userId", "messageId");
