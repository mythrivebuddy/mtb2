-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."ProgressStage" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."NotesPrivacy" AS ENUM ('PRIVATE_TO_AUTHOR', 'VISIBLE_TO_GROUP');

-- CreateEnum
CREATE TYPE "public"."CycleDuration" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "public"."Goal" ADD COLUMN     "stage" "public"."ProgressStage" NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "visibility" "public"."Visibility" NOT NULL DEFAULT 'PUBLIC';
