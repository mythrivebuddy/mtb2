/*
  Warnings:

  - You are about to drop the `FeatureConfigAudit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."FeatureConfigAudit" DROP CONSTRAINT "FeatureConfigAudit_configId_fkey";

-- DropTable
DROP TABLE "public"."FeatureConfigAudit";
