-- CreateEnum
CREATE TYPE "public"."ChallengeJoinMode" AS ENUM ('MANUAL', 'SYSTEM_ONLY');

-- AlterTable
ALTER TABLE "public"."challenges" ADD COLUMN     "joinMode" "public"."ChallengeJoinMode" NOT NULL DEFAULT 'MANUAL';
