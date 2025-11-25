-- CreateEnum
CREATE TYPE "public"."SignatureType" AS ENUM ('IMAGE', 'TEXT', 'DRAWN');

-- CreateTable
CREATE TABLE "public"."ChallengeCreatorSignature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."SignatureType" NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeCreatorSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeCreatorSignature_userId_key" ON "public"."ChallengeCreatorSignature"("userId");

-- AddForeignKey
ALTER TABLE "public"."ChallengeCreatorSignature" ADD CONSTRAINT "ChallengeCreatorSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
