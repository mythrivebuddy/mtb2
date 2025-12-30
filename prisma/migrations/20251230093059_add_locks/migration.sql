-- AlterTable
ALTER TABLE "public"."UserMakeoverCommitment" ADD COLUMN     "isFinal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false;
