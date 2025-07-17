/*
  Warnings:

  - The values [CANCELLED] on the enum `ChallengeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isCompleted` on the `challenge_tasks` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChallengeStatus_new" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');
ALTER TABLE "challenges" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "challenges" ALTER COLUMN "status" TYPE "ChallengeStatus_new" USING ("status"::text::"ChallengeStatus_new");
ALTER TYPE "ChallengeStatus" RENAME TO "ChallengeStatus_old";
ALTER TYPE "ChallengeStatus_new" RENAME TO "ChallengeStatus";
DROP TYPE "ChallengeStatus_old";
ALTER TABLE "challenges" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- AlterTable
ALTER TABLE "challenge_enrollments" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "challenge_tasks" DROP COLUMN "isCompleted";

-- CreateTable
CREATE TABLE "user_challenge_tasks" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "enrollmentId" TEXT NOT NULL,
    "templateTaskId" TEXT NOT NULL,

    CONSTRAINT "user_challenge_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_challenge_tasks" ADD CONSTRAINT "user_challenge_tasks_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "challenge_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenge_tasks" ADD CONSTRAINT "user_challenge_tasks_templateTaskId_fkey" FOREIGN KEY ("templateTaskId") REFERENCES "challenge_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
