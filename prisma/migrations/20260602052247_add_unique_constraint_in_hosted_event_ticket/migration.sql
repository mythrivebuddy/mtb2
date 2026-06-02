/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `HostedEventTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HostedEventTicket_eventId_key" ON "public"."HostedEventTicket"("eventId");
