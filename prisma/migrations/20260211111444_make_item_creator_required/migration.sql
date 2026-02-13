/*
  Warnings:

  - Made the column `createdByRole` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdByUserId` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "public"."Item" ALTER COLUMN "createdByRole" SET NOT NULL,
ALTER COLUMN "createdByUserId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
