-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isBloom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
