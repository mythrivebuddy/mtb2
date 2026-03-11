-- CreateTable
CREATE TABLE "public"."_ProgramCoupons" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramCoupons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProgramCoupons_B_index" ON "public"."_ProgramCoupons"("B");

-- AddForeignKey
ALTER TABLE "public"."_ProgramCoupons" ADD CONSTRAINT "_ProgramCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProgramCoupons" ADD CONSTRAINT "_ProgramCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
