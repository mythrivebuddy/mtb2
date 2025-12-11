-- CreateTable
CREATE TABLE "public"."AdminCashfreeConfigSettings" (
    "id" SERIAL NOT NULL,
    "cashfreeMode" TEXT NOT NULL DEFAULT 'sandbox',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCashfreeConfigSettings_pkey" PRIMARY KEY ("id")
);
