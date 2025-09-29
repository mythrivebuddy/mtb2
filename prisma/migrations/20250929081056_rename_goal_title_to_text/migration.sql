/*
  Warnings:

  - You are about to drop the column `title` on the `Goal` table. All the data in the column will be lost.
  - Added the required column `text` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Goal" DROP COLUMN "title",
ADD COLUMN     "text" TEXT NOT NULL;
