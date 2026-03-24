-- CreateTable
CREATE TABLE "public"."_CouponStoreProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CouponStoreProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CouponStoreProducts_B_index" ON "public"."_CouponStoreProducts"("B");

-- AddForeignKey
ALTER TABLE "public"."_CouponStoreProducts" ADD CONSTRAINT "_CouponStoreProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CouponStoreProducts" ADD CONSTRAINT "_CouponStoreProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
