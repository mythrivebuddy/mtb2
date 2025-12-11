-- AlterTable
ALTER TABLE "public"."challenges" ADD COLUMN     "creatorSignatureText" TEXT,
ADD COLUMN     "creatorSignatureUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."challenge_certificates" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateUrl" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "verificationHash" TEXT NOT NULL,

    CONSTRAINT "challenge_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_certificates_certificateId_key" ON "public"."challenge_certificates"("certificateId");

-- AddForeignKey
ALTER TABLE "public"."challenge_certificates" ADD CONSTRAINT "challenge_certificates_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_certificates" ADD CONSTRAINT "challenge_certificates_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_certificates" ADD CONSTRAINT "challenge_certificates_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
