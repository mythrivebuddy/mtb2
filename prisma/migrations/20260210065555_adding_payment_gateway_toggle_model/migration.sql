-- CreateTable
CREATE TABLE "public"."AdminPaymentGatewayConfig" (
    "id" SERIAL NOT NULL,
    "activeGateway" TEXT NOT NULL DEFAULT 'CASHFREE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);
