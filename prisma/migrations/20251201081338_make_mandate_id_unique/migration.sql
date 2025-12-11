/*
  Warnings:

  - A unique constraint covering the columns `[mandateId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Subscription_mandateId_key" ON "public"."Subscription"("mandateId");
