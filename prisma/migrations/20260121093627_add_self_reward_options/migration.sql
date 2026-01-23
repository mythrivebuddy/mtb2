/*
  Warnings:

  - You are about to drop the column `rewardId` on the `UserMakeoverSelfReward` table. All the data in the column will be lost.
  - Added the required column `rewardLibraryId` to the `MakeoverSelfRewardCheckpoint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MakeoverSelfRewardCheckpoint" ADD COLUMN     "rewardLibraryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserMakeoverSelfReward" DROP COLUMN "rewardId",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "rewardOptionId" TEXT;

-- CreateTable
CREATE TABLE "public"."MakeoverSelfRewardOption" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MakeoverSelfRewardOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MakeoverSelfRewardOption" ADD CONSTRAINT "MakeoverSelfRewardOption_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "public"."MakeoverSelfRewardLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverSelfRewardCheckpoint" ADD CONSTRAINT "MakeoverSelfRewardCheckpoint_rewardLibraryId_fkey" FOREIGN KEY ("rewardLibraryId") REFERENCES "public"."MakeoverSelfRewardLibrary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverSelfReward" ADD CONSTRAINT "UserMakeoverSelfReward_rewardOptionId_fkey" FOREIGN KEY ("rewardOptionId") REFERENCES "public"."MakeoverSelfRewardOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
