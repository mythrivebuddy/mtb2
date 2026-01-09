-- AlterTable
ALTER TABLE "public"."MakeoverProgressLog" ADD COLUMN     "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
