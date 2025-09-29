-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "coachId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
