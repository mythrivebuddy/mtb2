/*
  Warnings:

  - You are about to drop the `ProductBillingInformation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductBillingInformation" DROP CONSTRAINT "ProductBillingInformation_userId_fkey";

-- DropTable
DROP TABLE "public"."ProductBillingInformation";

-- CreateTable
CREATE TABLE "public"."UserBillingInformation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBillingInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBillingInformation_userId_key" ON "public"."UserBillingInformation"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserBillingInformation" ADD CONSTRAINT "UserBillingInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
