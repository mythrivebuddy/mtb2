-- AlterTable
ALTER TABLE "public"."Program" ADD COLUMN     "createdBy" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Program" ADD CONSTRAINT "Program_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
