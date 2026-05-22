-- AlterTable
ALTER TABLE "public"."UserProgramState" ADD COLUMN     "lastNudgeReminderAt" TIMESTAMP(3),
ADD COLUMN     "lastPrimaryReminderAt" TIMESTAMP(3);
