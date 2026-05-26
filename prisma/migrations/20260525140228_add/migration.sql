-- CreateEnum
CREATE TYPE "public"."HostedEventType" AS ENUM ('RETREAT', 'WEBINAR', 'WORKSHOP', 'ONE_ON_ONE', 'COURSE');

-- CreateEnum
CREATE TYPE "public"."HostedEventFormat" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."HostedEventResourceVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED');

-- CreateTable
CREATE TABLE "public"."HostedEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."HostedEventType" NOT NULL,
    "categoryId" INTEGER,
    "customCategory" TEXT,
    "coverImage" TEXT,
    "format" "public"."HostedEventFormat" NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "meetingPlatform" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "resources" TEXT,
    "resourcesVisibility" "public"."HostedEventResourceVisibility" NOT NULL DEFAULT 'PUBLIC',
    "creatorId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HostedEventEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostedEventEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HostedEventTicket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "currency" "public"."SubscriptionPlanCurrency" NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostedEventTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HostedEventAgendaSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostedEventAgendaSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HostedEvent_categoryId_idx" ON "public"."HostedEvent"("categoryId");

-- CreateIndex
CREATE INDEX "HostedEvent_creatorId_idx" ON "public"."HostedEvent"("creatorId");

-- CreateIndex
CREATE INDEX "HostedEventEnrollment_ticketId_idx" ON "public"."HostedEventEnrollment"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "HostedEventEnrollment_userId_eventId_key" ON "public"."HostedEventEnrollment"("userId", "eventId");

-- CreateIndex
CREATE INDEX "HostedEventTicket_eventId_idx" ON "public"."HostedEventTicket"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "HostedEventTicket_eventId_name_key" ON "public"."HostedEventTicket"("eventId", "name");

-- CreateIndex
CREATE INDEX "HostedEventAgendaSlot_eventId_idx" ON "public"."HostedEventAgendaSlot"("eventId");

-- CreateIndex
CREATE INDEX "HostedEventAgendaSlot_eventId_day_idx" ON "public"."HostedEventAgendaSlot"("eventId", "day");

-- CreateIndex
CREATE INDEX "HostedEventAgendaSlot_eventId_day_order_idx" ON "public"."HostedEventAgendaSlot"("eventId", "day", "order");

-- CreateIndex
CREATE UNIQUE INDEX "HostedEventAgendaSlot_eventId_day_order_key" ON "public"."HostedEventAgendaSlot"("eventId", "day", "order");

-- AddForeignKey
ALTER TABLE "public"."HostedEvent" ADD CONSTRAINT "HostedEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."MakeoverArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HostedEvent" ADD CONSTRAINT "HostedEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HostedEventEnrollment" ADD CONSTRAINT "HostedEventEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HostedEventEnrollment" ADD CONSTRAINT "HostedEventEnrollment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."HostedEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HostedEventEnrollment" ADD CONSTRAINT "HostedEventEnrollment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."HostedEventTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HostedEventTicket" ADD CONSTRAINT "HostedEventTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."HostedEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HostedEventAgendaSlot" ADD CONSTRAINT "HostedEventAgendaSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."HostedEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
