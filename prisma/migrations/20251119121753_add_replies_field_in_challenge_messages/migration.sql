-- AlterTable
ALTER TABLE "public"."challenge_messages" ADD COLUMN     "replyToId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."challenge_messages" ADD CONSTRAINT "challenge_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."challenge_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
