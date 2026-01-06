-- CreateTable
CREATE TABLE "public"."UserVisionImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVisionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserVisionImage_userId_programId_quarter_key" ON "public"."UserVisionImage"("userId", "programId", "quarter");

-- AddForeignKey
ALTER TABLE "public"."UserVisionImage" ADD CONSTRAINT "UserVisionImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
