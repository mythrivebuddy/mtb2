-- CreateEnum
CREATE TYPE "public"."GettingStartedStatus" AS ENUM ('NOT_STARTED', 'STARTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "gettingStartedStatus" "public"."GettingStartedStatus";
