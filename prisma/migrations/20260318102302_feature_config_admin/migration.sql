-- CreateEnum
CREATE TYPE "public"."FeatureUserType" AS ENUM ('COACH', 'SOLOPRENEUR', 'ENTHUSIAST');

-- CreateTable
CREATE TABLE "public"."Feature" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configSchema" JSONB,
    "allowedUserTypes" "public"."FeatureUserType"[],
    "actions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeaturePlanConfig" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "membership" TEXT NOT NULL,
    "userType" "public"."FeatureUserType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturePlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureConfigAudit" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "oldConfig" JSONB NOT NULL,
    "newConfig" JSONB NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureConfigAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_key_key" ON "public"."Feature"("key");

-- CreateIndex
CREATE INDEX "FeaturePlanConfig_featureId_membership_userType_idx" ON "public"."FeaturePlanConfig"("featureId", "membership", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturePlanConfig_featureId_membership_userType_key" ON "public"."FeaturePlanConfig"("featureId", "membership", "userType");

-- AddForeignKey
ALTER TABLE "public"."FeaturePlanConfig" ADD CONSTRAINT "FeaturePlanConfig_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "public"."Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureConfigAudit" ADD CONSTRAINT "FeatureConfigAudit_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."FeaturePlanConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
