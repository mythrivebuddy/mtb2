-- AlterTable
ALTER TABLE "public"."Program" ADD COLUMN     "achievements" JSONB,
ADD COLUMN     "certificateTitle" TEXT,
ADD COLUMN     "completionThreshold" INTEGER DEFAULT 100,
ADD COLUMN     "currency" TEXT DEFAULT 'INR',
ADD COLUMN     "modules" JSONB,
ADD COLUMN     "price" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "status" TEXT DEFAULT 'DRAFT',
ADD COLUMN     "unlockType" TEXT DEFAULT 'daily';
