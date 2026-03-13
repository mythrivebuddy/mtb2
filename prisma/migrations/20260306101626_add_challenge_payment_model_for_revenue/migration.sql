-- CreateTable
CREATE TABLE "public"."challenge_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "challenge_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_payments_paymentOrderId_key" ON "public"."challenge_payments"("paymentOrderId");

-- CreateIndex
CREATE INDEX "challenge_payments_userId_idx" ON "public"."challenge_payments"("userId");

-- CreateIndex
CREATE INDEX "challenge_payments_challengeId_idx" ON "public"."challenge_payments"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_payments_userId_challengeId_key" ON "public"."challenge_payments"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "public"."challenge_payments" ADD CONSTRAINT "challenge_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_payments" ADD CONSTRAINT "challenge_payments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_payments" ADD CONSTRAINT "challenge_payments_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
