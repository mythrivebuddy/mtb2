/*
  Warnings:

  - You are about to drop the `ProudtBlillingInformation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProudtBlillingInformation" DROP CONSTRAINT "ProudtBlillingInformation_userId_fkey";

-- DropTable
DROP TABLE "public"."ProudtBlillingInformation";

-- CreateTable
CREATE TABLE "public"."ProductBillingInformation" (
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

    CONSTRAINT "ProductBillingInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductBillingInformation_userId_key" ON "public"."ProductBillingInformation"("userId");

-- AddForeignKey
ALTER TABLE "public"."ProductBillingInformation" ADD CONSTRAINT "ProductBillingInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
