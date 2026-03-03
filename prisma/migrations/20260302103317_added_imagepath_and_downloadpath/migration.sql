/*
  Warnings:

  - Added the required column `imagePath` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "downloadPath" TEXT,
ADD COLUMN     "imagePath" TEXT NOT NULL;
