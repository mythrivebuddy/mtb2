-- AlterTable
ALTER TABLE "public"."Announcement" ADD COLUMN     "audiences" TEXT[] DEFAULT ARRAY[]::TEXT[];
