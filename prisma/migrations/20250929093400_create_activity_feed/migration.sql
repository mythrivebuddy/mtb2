-- CreateEnum
CREATE TYPE "public"."ActivityFeedType" AS ENUM ('GOAL_CREATED', 'GOAL_COMPLETED', 'COMMENT_ADDED', 'USER_JOINED_GROUP', 'CYCLE_STARTED', 'CYCLE_ENDED');

-- CreateTable
CREATE TABLE "public"."ActivityFeedItem" (
    "id" TEXT NOT NULL,
    "type" "public"."ActivityFeedType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "goalId" TEXT,
    "commentId" TEXT,

    CONSTRAINT "ActivityFeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityFeedItem_groupId_createdAt_idx" ON "public"."ActivityFeedItem"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityFeedItem_actorId_idx" ON "public"."ActivityFeedItem"("actorId");

-- AddForeignKey
ALTER TABLE "public"."ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "public"."Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
