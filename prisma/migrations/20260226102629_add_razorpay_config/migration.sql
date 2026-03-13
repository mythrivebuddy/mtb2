-- CreateTable
CREATE TABLE "public"."AdminRazorpayConfigSettings" (
    "id" SERIAL NOT NULL,
    "razorpayMode" TEXT NOT NULL DEFAULT 'test',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRazorpayConfigSettings_pkey" PRIMARY KEY ("id")
);
