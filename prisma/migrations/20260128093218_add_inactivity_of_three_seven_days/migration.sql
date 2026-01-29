-- AlterTable
ALTER TABLE "public"."UserProgramState" ADD COLUMN     "inactivity3DayNotified" TIMESTAMP(3),
ADD COLUMN     "inactivity7DayNotified" TIMESTAMP(3);
