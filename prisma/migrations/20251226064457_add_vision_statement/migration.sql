-- DropForeignKey
ALTER TABLE "public"."UserMakeoverCommitment" DROP CONSTRAINT "UserMakeoverCommitment_areaId_fkey";

-- AlterTable
ALTER TABLE "public"."UserMakeoverCommitment" ADD COLUMN     "visionStatement" TEXT,
ALTER COLUMN "areaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverCommitment" ADD CONSTRAINT "UserMakeoverCommitment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
