-- AlterTable
ALTER TABLE "public"."MiniMasteryCourseCompletion" ADD COLUMN     "certificateId" TEXT,
ADD COLUMN     "certificateUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."mini_mastery_creator_signatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mini_mastery_creator_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mini_mastery_certificates" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "verificationHash" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mini_mastery_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mini_mastery_creator_signatures_userId_key" ON "public"."mini_mastery_creator_signatures"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mini_mastery_certificates_certificateId_key" ON "public"."mini_mastery_certificates"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "mini_mastery_certificates_verificationHash_key" ON "public"."mini_mastery_certificates"("verificationHash");

-- CreateIndex
CREATE INDEX "mini_mastery_certificates_participantId_idx" ON "public"."mini_mastery_certificates"("participantId");

-- CreateIndex
CREATE INDEX "mini_mastery_certificates_programId_idx" ON "public"."mini_mastery_certificates"("programId");

-- CreateIndex
CREATE INDEX "mini_mastery_certificates_issuedById_idx" ON "public"."mini_mastery_certificates"("issuedById");

-- AddForeignKey
ALTER TABLE "public"."mini_mastery_creator_signatures" ADD CONSTRAINT "mini_mastery_creator_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mini_mastery_certificates" ADD CONSTRAINT "mini_mastery_certificates_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mini_mastery_certificates" ADD CONSTRAINT "mini_mastery_certificates_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mini_mastery_certificates" ADD CONSTRAINT "mini_mastery_certificates_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
