-- CreateEnum
CREATE TYPE "public"."TaxFormType" AS ENUM ('W8BEN', 'W9');

-- CreateEnum
CREATE TYPE "public"."BankAccountType" AS ENUM ('SAVINGS', 'CURRENT');

-- CreateTable
CREATE TABLE "public"."UserFinancialDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT,
    "panNumber" TEXT,
    "isGstRegistered" BOOLEAN NOT NULL DEFAULT false,
    "gstNumber" TEXT,
    "taxId" TEXT,
    "vatNumber" TEXT,
    "taxFormType" "public"."TaxFormType",
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankAccountType" "public"."BankAccountType",
    "upiId" TEXT,
    "paypalId" TEXT,
    "whatsappNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFinancialDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFinancialDetails_userId_key" ON "public"."UserFinancialDetails"("userId");

-- CreateIndex
CREATE INDEX "UserFinancialDetails_country_idx" ON "public"."UserFinancialDetails"("country");

-- AddForeignKey
ALTER TABLE "public"."UserFinancialDetails" ADD CONSTRAINT "UserFinancialDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
