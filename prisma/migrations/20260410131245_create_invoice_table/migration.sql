-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentOrderId" TEXT,
    "contextType" "public"."PaymentContextType" NOT NULL,
    "referenceId" TEXT,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PAID',
    "items" JSONB NOT NULL,
    "billing" JSONB NOT NULL,
    "business" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentOrderId_key" ON "public"."Invoice"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "public"."Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_paymentOrderId_idx" ON "public"."Invoice"("paymentOrderId");

-- CreateIndex
CREATE INDEX "Invoice_contextType_idx" ON "public"."Invoice"("contextType");

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
