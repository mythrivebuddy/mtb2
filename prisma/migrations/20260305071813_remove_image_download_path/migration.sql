/*
  Warnings:

  - You are about to drop the column `downloadPath` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `imagePath` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "downloadPath",
DROP COLUMN "imagePath";
