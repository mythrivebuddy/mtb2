-- CreateTable
CREATE TABLE "public"."challenge_messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,

    CONSTRAINT "challenge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_messages_challengeId_createdAt_idx" ON "public"."challenge_messages"("challengeId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."challenge_messages" ADD CONSTRAINT "challenge_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_messages" ADD CONSTRAINT "challenge_messages_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
