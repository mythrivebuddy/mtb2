-- CreateTable
CREATE TABLE "public"."Nudge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "pushNotificationSent" BOOLEAN NOT NULL DEFAULT false,
    "sendEmail" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "subject" TEXT,
    "emailContent" TEXT,
    "url" TEXT NOT NULL,

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);
