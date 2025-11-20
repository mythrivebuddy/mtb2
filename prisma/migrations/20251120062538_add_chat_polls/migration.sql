-- AlterTable
ALTER TABLE "public"."challenge_messages" ALTER COLUMN "message" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."challenge_polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT true,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "challenge_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."challenge_poll_options" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "challenge_poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."challenge_poll_votes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "challenge_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_polls_messageId_key" ON "public"."challenge_polls"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_poll_votes_userId_optionId_key" ON "public"."challenge_poll_votes"("userId", "optionId");

-- AddForeignKey
ALTER TABLE "public"."challenge_polls" ADD CONSTRAINT "challenge_polls_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."challenge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_poll_options" ADD CONSTRAINT "challenge_poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."challenge_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_poll_votes" ADD CONSTRAINT "challenge_poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_poll_votes" ADD CONSTRAINT "challenge_poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."challenge_poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
