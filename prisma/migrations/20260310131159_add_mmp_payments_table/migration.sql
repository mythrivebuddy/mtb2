-- CreateTable
CREATE TABLE "public"."MiniMasteryProgramPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "MiniMasteryProgramPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MiniMasteryProgramPayment_paymentOrderId_key" ON "public"."MiniMasteryProgramPayment"("paymentOrderId");

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryProgramPayment" ADD CONSTRAINT "MiniMasteryProgramPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryProgramPayment" ADD CONSTRAINT "MiniMasteryProgramPayment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryProgramPayment" ADD CONSTRAINT "MiniMasteryProgramPayment_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
